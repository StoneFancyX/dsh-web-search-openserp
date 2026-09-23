import type { WebFetchProvider, WebFetchRequest, WebFetchResult } from '@deepseek-ai/dsh-web';
/** Stable id this provider registers under, and the value `web.fetchProvider` selects. */
export declare const OPENSERP_FETCH_PROVIDER_ID = "openserp";
/**
 * Resource backstop for one extraction.
 *
 * Looser than the search budget on purpose: an extraction covers a single URL
 * but may have to render it in a browser first, and even `mode=fast` waits on
 * the origin server. The instance's own `extract.timeout` (20s by default)
 * applies underneath this, so this only needs headroom above it.
 */
export declare const OPENSERP_DEFAULT_FETCH_TIMEOUT_MS = 30000;
/**
 * How the instance should obtain the page.
 *
 * - `auto` — try a plain HTTP fetch, escalate to a browser when the body looks
 *   like a JavaScript shell. The right default: fast pages stay fast.
 * - `fast` — never render. Fails on single-page apps.
 * - `rendered` — always render. Slowest, but survives heavy client-side sites.
 */
export type OpenserpExtractMode = 'auto' | 'fast' | 'rendered';
/** Resolved provider options; the plugin's `apply` fills every default. */
export interface OpenserpFetchProviderOptions {
    /**
     * Instance base URL (`/extract` is appended). `undefined` or unparseable
     * makes the provider report unavailable instead of failing every fetch.
     */
    readonly baseURL?: string;
    /** Resource backstop in milliseconds. */
    readonly timeoutMs: number;
    /** How the instance should fetch the page. */
    readonly mode: OpenserpExtractMode;
    /**
     * Return the whole readable body instead of article-only text.
     *
     * Off (the default) runs trafilatura, which strips navigation and landing
     * furniture — right for "read me this article". On keeps nav and feature
     * blocks, which an agent looking for a link or a menu may need.
     */
    readonly fullPage: boolean;
    /**
     * For a site root, prefer the site's `/llms-full.txt` or `/llms.txt` when it
     * publishes one. Cheap and precise for documentation sites.
     */
    readonly useLlmsTxt: boolean;
    /** Extra request headers, e.g. for an instance behind an authenticating proxy. */
    readonly headers?: Readonly<Record<string, string>>;
}
/** Provider implementation registered into `ctx.web` for the fetch capability. */
export declare class OpenserpFetchProvider implements WebFetchProvider {
    #private;
    /** Stable id; `web.fetchProvider` selects this provider by it. */
    readonly id = "openserp";
    /**
     * @param options - thunk returning the current resolved options. A thunk
     * rather than a snapshot so a settings edit reaches the next fetch.
     */
    constructor(options: () => OpenserpFetchProviderOptions);
    /** Cheap local check: a parseable http(s) base URL. Never touches the network. */
    available(): boolean;
    fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult>;
}
