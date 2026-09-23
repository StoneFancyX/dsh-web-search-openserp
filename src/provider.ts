/**
 * OpenSERP-backed `WebSearchProvider` for the harness web capability seam.
 *
 * OpenSERP is a self-hosted SERP API that renders each engine through a real
 * headless browser. That is the whole point of using it here: a metASearch
 * instance which merely impersonates a browser over HTTP is refused by every
 * engine that matters (Baidu, Google, DuckDuckGo answer a data-centre IP with a
 * CAPTCHA), while a genuinely rendered session gets through.
 *
 * One search is a plain retrieval call against the instance — no model turn, no
 * generated tokens.
 *
 * @module dsh-web-search-openserp/provider
 */
import { WebError } from '@deepseek-ai/dsh-web'
import type {
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@deepseek-ai/dsh-web'
import type { OpenserpResponse, OpenserpResult } from './types.js'

/** Stable id this provider registers under, and the value `web.searchProvider` selects. */
export const OPENSERP_PROVIDER_ID = 'openserp'

/**
 * Resource backstop for one search.
 *
 * Larger than the SearXNG default on purpose: OpenSERP renders pages in a real
 * browser, so a cold Chrome plus a slow engine legitimately takes seconds. The
 * default covers a cold start; a deployment that keeps the browser warm can
 * lower it. Keep it below the model-facing tool budget so a slow engine
 * surfaces as a provider timeout rather than a tool timeout.
 */
export const OPENSERP_DEFAULT_TIMEOUT_MS = 20_000

/**
 * Cap on one source's snippet. Engine excerpts are short, but an `extract=1`
 * body is a whole page; the seam has no snippet bound of its own, so an
 * uncapped provider would let one verbose page dominate the result budget.
 */
export const OPENSERP_DEFAULT_MAX_SNIPPET_CHARS = 500

/** Engines OpenSERP can address. `bing` is deliberately absent from the default set. */
export const OPENSERP_KNOWN_ENGINES = [
  'baidu',
  'google',
  'duckduckgo',
  'bing',
  'yandex',
  'ecosia',
] as const

/** Resolved provider options; the plugin's `apply` fills every default. */
export interface OpenserpSearchProviderOptions {
  /**
   * Instance base URL (the search path is appended). `undefined` or unparseable
   * makes the provider report unavailable instead of failing every search.
   */
  readonly baseURL?: string
  /**
   * Engines to query. One entry hits that engine's dedicated endpoint; several
   * hit `mega/search`, which merges and deduplicates them.
   */
  readonly engines?: readonly string[]
  /** Resource backstop in milliseconds. */
  readonly timeoutMs: number
  /** Per-source snippet cap in characters. */
  readonly maxSnippetChars: number
  /**
   * Ask OpenSERP to fetch and extract each target page (`extract=1`). Richer
   * grounding, but it makes the request markedly slower and the bodies are
   * whole pages, so the snippet cap does the trimming.
   */
  readonly extract: boolean
  /**
   * Extra request headers, e.g. an auth header for an instance behind a
   * reverse proxy.
   */
  readonly headers?: Readonly<Record<string, string>>
}

/** Parse `baseURL` once so `available()` stays a cheap synchronous check. */
function parseBaseURL(baseURL: string | undefined): URL | undefined {
  if (baseURL === undefined || baseURL.trim().length === 0) return undefined
  let parsed: URL
  try {
    parsed = new URL(baseURL)
  } catch {
    return undefined
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : undefined
}

/** Read one wire field as a non-empty trimmed string, or `undefined`. */
function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

/** Truncate a snippet to the configured cap without splitting a surrogate pair. */
function cap(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  const cut = value.slice(0, maxChars)
  const last = cut.charCodeAt(cut.length - 1)
  // A high surrogate at the boundary lost its pair; drop it rather than emit U+FFFD.
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut
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
export function isNonResultType(type: string | undefined): boolean {
  return type === 'ad' || type === 'answer_box' || type === 'related_searches'
}

/**
 * Baidu redirect hosts that only ever wrap a sponsored placement.
 *
 * Measured directly (2026-09): a sponsored row arrives as
 * `http://nourl.ubs.baidu.com/61344` with `type: "organic"` and `ad: null` —
 * Baidu's marker was not on the card OpenSERP parsed, so neither the instance's
 * own ad filter nor `isNonResultType` sees it. The title is dressed up as an
 * official page ("Python asyncio 官方文档" while linking to a Baike stub), which
 * is exactly the kind of citation an agent should never be handed.
 *
 * `www.baidu.com/link?url=` is deliberately NOT in this list. Baidu wraps
 * ordinary results in that redirect too — a real hit ("Python asyncio并发编程",
 * a Tsinghua University Press book page) arrived through it in the same SERP.
 * Blocklisting it would drop good results along with the ads.
 */
const AD_REDIRECT_HOSTS = ['nourl.ubs.baidu.com'] as const

/**
 * Whether a result URL is a sponsored placement that its own metadata failed to
 * flag. See {@link AD_REDIRECT_HOSTS} for the measurement behind the list.
 * @param url - the result URL as the instance reported it.
 * @returns true when the URL is a known ad-only redirect.
 */
export function isAdURL(url: string): boolean {
  if (url.length === 0) return false
  // `baidu.php?url=` is the shape of an ad redirect on a live SERP; the markers
  // observed through OpenSERP use `nourl.ubs` instead, but both are ad-only.
  if (url.includes('baidu.php?url=')) return true
  return AD_REDIRECT_HOSTS.some((host) => url.includes(host))
}

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
export function mapOpenserpResponse(
  body: OpenserpResponse,
  maxSnippetChars: number,
): WebSearchResult {
  const rawResults = Array.isArray(body.results) ? (body.results as readonly OpenserpResult[]) : []
  const sources: WebSearchSource[] = []
  const seen = new Set<string>()

  for (const result of rawResults) {
    if (isNonResultType(text(result?.type))) continue
    if (result?.ad === true) continue

    const url = text(result?.url)
    if (url === undefined || seen.has(url)) continue
    // Checked before the dedup set is updated: a sponsored row must not claim
    // the URL slot that a later, legitimate result for the same target needs.
    if (isAdURL(url)) continue
    seen.add(url)

    const title = text(result?.title)

    // Prefer the extracted body when the request asked for one: an engine
    // excerpt is a teaser the model then has to fetch through, whereas the
    // extracted body is the text it actually needs. `extracted` is nullable —
    // extraction fails on some pages — so the excerpt stays the fallback.
    const extractedBody = text(result?.extracted?.content)
    const snippet = extractedBody ?? text(result?.snippet)
    const publishedAt = text(result?.published_at)

    sources.push({
      url,
      ...(title === undefined ? {} : { title }),
      ...(snippet === undefined ? {} : { snippet: cap(snippet, maxSnippetChars) }),
      ...(publishedAt === undefined ? {} : { publishedAt }),
    })
  }

  return { sources, truncated: false }
}

/** Cap on the error body read back from a rejected request. */
const ERROR_BODY_MAX_CHARS = 300

/**
 * Read the instance's own reason for refusing a request.
 *
 * OpenSERP answers a bad parameter with a JSON `{"error": …}` or a plain-text
 * body depending on how far the request got; either way the body names the
 * misconfigured field, which a bare status code cannot.
 * @param response - the non-2xx response, whose body is still unread.
 * @returns the reason, or `undefined` when the body carries none.
 */
async function instanceErrorText(response: Response): Promise<string | undefined> {
  let body: string
  try {
    body = await response.text()
  } catch {
    return undefined
  }
  const trimmed = body.trim()
  if (trimmed.length === 0) return undefined
  return trimmed.length > ERROR_BODY_MAX_CHARS ? `${trimmed.slice(0, ERROR_BODY_MAX_CHARS)}…` : trimmed
}

/**
 * Build the endpoint for one request.
 *
 * One engine goes to its dedicated `/«engine»/search` route; several go to
 * `/mega/search?engines=…`, which is the only route OpenSERP merges across
 * engines. No engines configured means `mega/search` with the server's own
 * default engine set.
 */
function buildSearchURL(
  endpoint: URL,
  options: OpenserpSearchProviderOptions,
  query: string,
  maxResults: number | undefined,
): URL {
  const engines = options.engines ?? []
  const base = endpoint.href.endsWith('/') ? endpoint.href : `${endpoint.href}/`

  const url =
    engines.length === 1
      ? new URL(`${encodeURIComponent(engines[0] ?? '')}/search`, base)
      : new URL('mega/search', base)

  url.searchParams.set('text', query)
  // Ask the instance for the caller's bound so the seam's own truncation has
  // something to truncate; it enforces `maxResults` regardless.
  url.searchParams.set('limit', String(maxResults ?? 10))
  if (engines.length > 1) url.searchParams.set('engines', engines.join(','))
  if (options.extract) url.searchParams.set('extract', '1')
  return url
}

/** Provider implementation registered into `ctx.web`. */
export class OpenserpSearchProvider implements WebSearchProvider {
  /** Stable id; `web.searchProvider` selects this provider by it. */
  readonly id = OPENSERP_PROVIDER_ID

  readonly #options: () => OpenserpSearchProviderOptions

  /**
   * @param options - thunk returning the current resolved options. A thunk
   * rather than a snapshot so a settings edit reaches the next search.
   */
  constructor(options: () => OpenserpSearchProviderOptions) {
    this.#options = options
  }

  /** Cheap local check: a parseable http(s) base URL. Never touches the network. */
  available(): boolean {
    return parseBaseURL(this.#options().baseURL) !== undefined
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const options = this.#options()
    const endpoint = parseBaseURL(options.baseURL)
    if (endpoint === undefined) {
      throw new WebError(
        "OpenSERP search has no usable baseURL; set the provider's baseURL (or $OPENSERP_URL) to the instance root",
        'WEB_PROVIDER_ERROR',
      )
    }

    const url = buildSearchURL(endpoint, options, request.query, request.maxResults)

    const timeout = AbortSignal.timeout(options.timeoutMs)
    const combined = signal === undefined ? timeout : AbortSignal.any([signal, timeout])

    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'error',
        headers: { accept: 'application/json', ...options.headers },
        signal: combined,
      })
    } catch (error) {
      if (signal?.aborted === true) {
        throw new WebError('OpenSERP search aborted', 'WEB_ABORTED', { cause: signal.reason })
      }
      if (timeout.aborted) {
        throw new WebError(
          `OpenSERP search timed out after ${options.timeoutMs}ms`,
          'WEB_PROVIDER_ERROR',
          { cause: timeout.reason },
        )
      }
      throw new WebError(`OpenSERP search request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', {
        cause: error,
      })
    }

    if (!response.ok) {
      const reason = await instanceErrorText(response)
      throw new WebError(
        `OpenSERP search failed with HTTP ${response.status}${reason === undefined ? '' : `: ${reason}`}`,
        'WEB_PROVIDER_ERROR',
      )
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) {
      throw new WebError(
        `OpenSERP returned "${contentType || 'no content-type'}" instead of JSON; is baseURL pointing at the OpenSERP server root?`,
        'WEB_PROVIDER_ERROR',
      )
    }

    let body: OpenserpResponse
    try {
      body = (await response.json()) as OpenserpResponse
    } catch (error) {
      throw new WebError(
        `OpenSERP returned an unprocessable response body: ${String(error)}`,
        'WEB_PROVIDER_ERROR',
        { cause: error },
      )
    }

    return mapOpenserpResponse(body, options.maxSnippetChars)
  }
}
