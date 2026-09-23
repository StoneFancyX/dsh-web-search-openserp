/**
 * OpenSERP-backed `WebFetchProvider` for the harness web capability seam.
 *
 * This provider deliberately does NOT return the resource as served. OpenSERP's
 * `/extract` cleans a page down to its readable body and hands back markdown
 * and plain text; there is no raw-HTML escape hatch, and none is wanted here.
 * `dsh-web-fetch-http` remains the provider for "give me the bytes"; this one
 * answers "give me something readable", which is what an agent actually needs
 * after a search.
 *
 * Every result is therefore `kind: 'text'`. A caller that genuinely needs the
 * served markup, or needs to drive a page, belongs in a browser-automation
 * tool — not on this path.
 *
 * @module dsh-web-search-openserp/fetch
 */
import { WebError } from '@deepseek-ai/dsh-web'
import type { WebFetchProvider, WebFetchRequest, WebFetchResult } from '@deepseek-ai/dsh-web'
import type { OpenserpExtractResponse } from './types.js'

/** Stable id this provider registers under, and the value `web.fetchProvider` selects. */
export const OPENSERP_FETCH_PROVIDER_ID = 'openserp'

/**
 * Resource backstop for one extraction.
 *
 * Looser than the search budget on purpose: an extraction covers a single URL
 * but may have to render it in a browser first, and even `mode=fast` waits on
 * the origin server. The instance's own `extract.timeout` (20s by default)
 * applies underneath this, so this only needs headroom above it.
 */
export const OPENSERP_DEFAULT_FETCH_TIMEOUT_MS = 30_000

/**
 * How the instance should obtain the page.
 *
 * - `auto` — try a plain HTTP fetch, escalate to a browser when the body looks
 *   like a JavaScript shell. The right default: fast pages stay fast.
 * - `fast` — never render. Fails on single-page apps.
 * - `rendered` — always render. Slowest, but survives heavy client-side sites.
 */
export type OpenserpExtractMode = 'auto' | 'fast' | 'rendered'

/** Resolved provider options; the plugin's `apply` fills every default. */
export interface OpenserpFetchProviderOptions {
  /**
   * Instance base URL (`/extract` is appended). `undefined` or unparseable
   * makes the provider report unavailable instead of failing every fetch.
   */
  readonly baseURL?: string
  /** Resource backstop in milliseconds. */
  readonly timeoutMs: number
  /** How the instance should fetch the page. */
  readonly mode: OpenserpExtractMode
  /**
   * Return the whole readable body instead of article-only text.
   *
   * Off (the default) runs trafilatura, which strips navigation and landing
   * furniture — right for "read me this article". On keeps nav and feature
   * blocks, which an agent looking for a link or a menu may need.
   */
  readonly fullPage: boolean
  /**
   * For a site root, prefer the site's `/llms-full.txt` or `/llms.txt` when it
   * publishes one. Cheap and precise for documentation sites.
   */
  readonly useLlmsTxt: boolean
  /** Extra request headers, e.g. for an instance behind an authenticating proxy. */
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

/** Cap on the error body read back from a rejected request. */
const ERROR_BODY_MAX_CHARS = 300

/**
 * Read the instance's own reason for refusing a request.
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

/** Provider implementation registered into `ctx.web` for the fetch capability. */
export class OpenserpFetchProvider implements WebFetchProvider {
  /** Stable id; `web.fetchProvider` selects this provider by it. */
  readonly id = OPENSERP_FETCH_PROVIDER_ID

  readonly #options: () => OpenserpFetchProviderOptions

  /**
   * @param options - thunk returning the current resolved options. A thunk
   * rather than a snapshot so a settings edit reaches the next fetch.
   */
  constructor(options: () => OpenserpFetchProviderOptions) {
    this.#options = options
  }

  /** Cheap local check: a parseable http(s) base URL. Never touches the network. */
  available(): boolean {
    return parseBaseURL(this.#options().baseURL) !== undefined
  }

  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    const options = this.#options()
    const endpoint = parseBaseURL(options.baseURL)
    if (endpoint === undefined) {
      throw new WebError(
        "OpenSERP fetch has no usable baseURL; set the provider's baseURL (or $OPENSERP_URL) to the instance root",
        'WEB_PROVIDER_ERROR',
      )
    }

    const base = endpoint.href.endsWith('/') ? endpoint.href : `${endpoint.href}/`
    const url = new URL('extract', base)
    url.searchParams.set('url', request.url)
    url.searchParams.set('mode', options.mode)
    if (options.fullPage) url.searchParams.set('clean', 'false')
    if (options.useLlmsTxt) url.searchParams.set('use_llms_txt', 'true')

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
        throw new WebError('OpenSERP fetch aborted', 'WEB_ABORTED', { cause: signal.reason })
      }
      if (timeout.aborted) {
        throw new WebError(
          `OpenSERP fetch timed out after ${options.timeoutMs}ms`,
          'WEB_PROVIDER_ERROR',
          { cause: timeout.reason },
        )
      }
      throw new WebError(`OpenSERP fetch request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', {
        cause: error,
      })
    }

    if (!response.ok) {
      // A 400 here is usually OpenSERP's private-network guard rejecting the
      // target, which no retry fixes — say so rather than reporting a bare
      // status.
      const reason = await instanceErrorText(response)
      const hint =
        response.status === 400
          ? ' (OpenSERP rejects loopback and private-network targets by default)'
          : ''
      throw new WebError(
        `OpenSERP fetch failed with HTTP ${response.status}${reason === undefined ? '' : `: ${reason}`}${hint}`,
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

    let body: OpenserpExtractResponse
    try {
      body = (await response.json()) as OpenserpExtractResponse
    } catch (error) {
      throw new WebError(
        `OpenSERP returned an unprocessable response body: ${String(error)}`,
        'WEB_PROVIDER_ERROR',
        { cause: error },
      )
    }

    // Prefer markdown over plain text: it keeps heading structure and links,
    // which is exactly the shape an agent reconstructs poorly from flattened
    // text. `text` is the fallback for pages where markdown rendering failed.
    const content = text(body.markdown) ?? text(body.text) ?? ''
    const finalURL = text(body.url) ?? request.url

    return {
      url: finalURL,
      // OpenSERP reports extraction failures as HTTP errors rather than as a
      // non-2xx upstream status, so reaching here means the page was retrieved.
      // The upstream status is deliberately not invented: the seam treats a
      // status code as part of the resource's state, and this provider does not
      // observe it.
      statusCode: 200,
      body: { kind: 'text', content },
      // The instance's own `max_bytes` cap is not surfaced in the response, so
      // claiming a truncation state here would be a guess.
      truncated: false,
    }
  }
}
