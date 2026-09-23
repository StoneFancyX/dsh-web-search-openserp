import type { WebSearchProvider, WebSearchRequest, WebSearchResult } from '@deepseek-ai/dsh-web';
import type { OpenserpResponse } from './types.js';
/** Stable id this provider registers under, and the value `web.searchProvider` selects. */
export declare const OPENSERP_PROVIDER_ID = "openserp";
/**
 * Resource backstop for one search.
 *
 * Larger than the SearXNG default on purpose: OpenSERP renders pages in a real
 * browser, so a cold Chrome plus a slow engine legitimately takes seconds. The
 * default covers a cold start; a deployment that keeps the browser warm can
 * lower it. Keep it below the model-facing tool budget so a slow engine
 * surfaces as a provider timeout rather than a tool timeout.
 */
export declare const OPENSERP_DEFAULT_TIMEOUT_MS = 20000;
/**
 * Cap on one source's snippet. Engine excerpts are short, but an `extract=1`
 * body is a whole page; the seam has no snippet bound of its own, so an
 * uncapped provider would let one verbose page dominate the result budget.
 */
export declare const OPENSERP_DEFAULT_MAX_SNIPPET_CHARS = 500;
/** Engines OpenSERP can address. `bing` is deliberately absent from the default set. */
export declare const OPENSERP_KNOWN_ENGINES: readonly ["baidu", "google", "duckduckgo", "bing", "yandex", "ecosia"];
/** Resolved provider options; the plugin's `apply` fills every default. */
export interface OpenserpSearchProviderOptions {
    /**
     * Instance base URL (the search path is appended). `undefined` or unparseable
     * makes the provider report unavailable instead of failing every search.
     */
    readonly baseURL?: string;
    /**
     * Engines to query. One entry hits that engine's dedicated endpoint; several
     * hit `mega/search`, which merges and deduplicates them.
     */
    readonly engines?: readonly string[];
    /** Resource backstop in milliseconds. */
    readonly timeoutMs: number;
    /** Per-source snippet cap in characters. */
    readonly maxSnippetChars: number;
    /**
     * Ask OpenSERP to fetch and extract each target page (`extract=1`). Richer
     * grounding, but it makes the request markedly slower and the bodies are
     * whole pages, so the snippet cap does the trimming.
     */
    readonly extract: boolean;
    /**
     * Extra request headers, e.g. an auth header for an instance behind a
     * reverse proxy.
     */
    readonly headers?: Readonly<Record<string, string>>;
}
/**
 * Decide whether one row is a sponsored or non-result module.
 *
 * Three independent signals, any of which is sufficient:
 *   - `type: "ad"` — what OpenSERP emits once it recognises a sponsored card;
 *   - `ad: true` — the same fact in the redundant boolean field;
 *   - `type: "answer_box" | "related_searches"` — SERP furniture that is not a
 *     result the model should cite.
 *
 * Belt-and-braces on purpose: the two engines disagree about how reliably they
 * label ads, and a mislabelled ad silently pollutes the model's context. The
 * `OPENSERP_DROP_ADS=1` instance setting removes most of them upstream; this is
 * the client-side guarantee for the ones that slip through.
 */
export declare function isNonResultType(type: string | undefined): boolean;
/**
 * Whether a result URL is a sponsored placement that its own metadata failed to
 * flag. See {@link AD_REDIRECT_HOSTS} for the measurement behind the list.
 * @param url - the result URL as the instance reported it.
 * @returns true when the URL is a known ad-only redirect.
 */
export declare function isAdURL(url: string): boolean;
/**
 * Map one instance response to the seam's normalized result.
 *
 * Sources are deduplicated by URL because a `mega/search` response merges
 * engines that routinely return the same page. `truncated` is always `false`:
 * the seam owns `maxResults` enforcement, and reporting our own truncation here
 * would make it lie about whose bound cut the list.
 *
 * @param body - the parsed search response.
 * @param maxSnippetChars - per-source snippet cap.
 * @returns the normalized search outcome.
 */
export declare function mapOpenserpResponse(body: OpenserpResponse, maxSnippetChars: number): WebSearchResult;
/** Provider implementation registered into `ctx.web`. */
export declare class OpenserpSearchProvider implements WebSearchProvider {
    #private;
    /** Stable id; `web.searchProvider` selects this provider by it. */
    readonly id = "openserp";
    /**
     * @param options - thunk returning the current resolved options. A thunk
     * rather than a snapshot so a settings edit reaches the next search.
     */
    constructor(options: () => OpenserpSearchProviderOptions);
    /** Cheap local check: a parseable http(s) base URL. Never touches the network. */
    available(): boolean;
    search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
}
