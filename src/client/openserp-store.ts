/**
 * Card state over the plugin's own gateway.
 *
 * The section rides `connection.rpc` → `/api/web-search-openserp/{get,set,reset}`
 * rather than the generic settings API, because the API proxy serves only an
 * allowlist of namespaces and a third-party one is not on it. See the host
 * gateway module for why that is the sanctioned route rather than a workaround.
 *
 * The editable vocabulary is declared here rather than imported from
 * `src/config.ts` or `src/fetch.ts`: those modules reach `@deepseek-ai/dsh-web`
 * (a runtime dependency of the providers), and a value import of them would
 * pull a server package into the browser bundle. Types and constants that must
 * agree with the host are mirrored, with the coupling named.
 *
 * @module dsh-web-search-openserp/client/openserp-store
 */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'

/** Mirrors `OpenserpExtractMode` in `src/fetch.ts`. */
export type ExtractMode = 'auto' | 'fast' | 'rendered'

/**
 * The engines the card offers, in the host's own order (`OPENSERP_KNOWN_ENGINES`).
 *
 * Mirrored rather than imported for the bundle reason in the module note.
 * `bing` stays on the list because the instance can address it, but the host's
 * documented default set excludes it: measured against a Chinese query it
 * returned unrelated results, so it costs a slot without adding signal.
 */
export const ENGINE_CHOICES = [
  { value: 'baidu', label: '百度' },
  { value: 'google', label: 'Google' },
  { value: 'duckduckgo', label: 'DuckDuckGo' },
  { value: 'bing', label: '必应（Bing）' },
  { value: 'yandex', label: 'Yandex' },
  { value: 'ecosia', label: 'Ecosia' },
] as const

/** The `/extract` modes the card offers, in escalating cost order. */
export const EXTRACT_MODE_CHOICES = [
  { value: '', labelKey: 'extractMode.inherit' },
  { value: 'auto', labelKey: 'extractMode.auto' },
  { value: 'fast', labelKey: 'extractMode.fast' },
  { value: 'rendered', labelKey: 'extractMode.rendered' },
] as const

/** Where the effective instance URL came from. Mirrors the host view. */
export type BaseUrlSource = 'settings' | 'environment' | 'none'

/** The host gateway's read view. */
export interface OpenserpSettingsView {
  value: {
    baseURL?: string
    engines?: string[]
    timeoutMs?: number
    maxSnippetChars?: number
    extract?: boolean
    fetchTimeoutMs?: number
    extractMode?: ExtractMode
    extractFullPage?: boolean
    extractUseLlmsTxt?: boolean
    headers?: Record<string, string>
  }
  effectiveBaseURL?: string
  baseURLSource: BaseUrlSource
  baseURLEnvVar: string
  writable: boolean
}

/** The editable credential pair. */
export interface BasicAuth {
  authUser: string
  authPass: string
}

/**
 * Every field the card edits.
 *
 * Numbers are held as STRINGS: a half-typed `20` in a number field is not the
 * number the user means yet, and round-tripping through `Number` on every
 * keystroke would rewrite `2e` to `NaN` under the cursor. They are parsed once,
 * at save time, where an unusable draft blocks the write instead of being
 * dropped.
 */
export interface OpenserpDraft {
  baseURL: string
  engines: string[]
  timeoutMs: string
  maxSnippetChars: string
  extract: boolean
  fetchTimeoutMs: string
  extractMode: '' | ExtractMode
  extractFullPage: boolean
  extractUseLlmsTxt: boolean
  authUser: string
  authPass: string
}

/** Everything the card renders from. */
export interface OpenserpCardState {
  status: 'loading' | 'ready' | 'failed'
  /** Failure text from the last load, or `undefined` while healthy. */
  error?: string | undefined
  /** Stored values, as the host last reported them. */
  stored: OpenserpDraft
  /** What the user has typed but not saved. */
  draft: OpenserpDraft
  /**
   * The stored `headers` map in full. Only the Basic Auth pair is editable, so
   * this is what keeps a deployment's other headers (an API key for a
   * reverse proxy, say) from being deleted by an unrelated save.
   */
  storedHeaders: Record<string, string>
  effectiveBaseURL?: string | undefined
  baseURLSource: BaseUrlSource
  baseURLEnvVar: string
  writable: boolean
  saving: boolean
}

const EMPTY_DRAFT: OpenserpDraft = {
  baseURL: '',
  engines: [],
  timeoutMs: '',
  maxSnippetChars: '',
  extract: false,
  fetchTimeoutMs: '',
  extractMode: '',
  extractFullPage: false,
  extractUseLlmsTxt: false,
  authUser: '',
  authPass: '',
}

const EMPTY: OpenserpCardState = {
  status: 'loading',
  stored: { ...EMPTY_DRAFT },
  draft: { ...EMPTY_DRAFT },
  storedHeaders: {},
  baseURLSource: 'none',
  baseURLEnvVar: 'OPENSERP_URL',
  writable: false,
  saving: false,
}

/**
 * Turn one base64 credential payload back into text.
 *
 * `atob` alone hands back a binary string, so a credential whose bytes are not
 * Latin-1 — any non-English username or password — would read as mojibake in
 * the form and be double-encoded on the next save. The bytes are decoded as
 * UTF-8, which is what {@link encodeBasicAuth} wrote and what RFC 7617 asks a
 * server to expect.
 *
 * A payload that is not valid UTF-8 is a credential stored by some other tool
 * in some other charset; the raw binary reading is returned rather than a
 * string full of U+FFFD, and because the card only writes a field the user
 * actually edited, an untouched legacy credential is never rewritten.
 * @param encoded - the base64 payload after the `Basic ` scheme.
 * @returns the decoded text, or `undefined` when the payload is not base64.
 */
function decodeBasicAuth(encoded: string): string | undefined {
  let binary: string
  try {
    binary = atob(encoded)
  } catch {
    return undefined
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return binary
  }
}

/**
 * Read the Basic Auth credential back from a stored `Authorization` header.
 *
 * The header stores `Basic <base64(user:pass)>`; the card edits the plain
 * user/pass form and re-encodes on save. A header that is not `Basic`-shaped
 * is left alone — it may be a bearer token or some other scheme the card has
 * no business parsing.
 * @param headers - the stored headers section.
 * @returns the plain user/pass pair, empty when no editable credential is present.
 */
export function basicAuthFromHeaders(headers: Record<string, string> | undefined): BasicAuth {
  const authorization = headers?.Authorization
  if (typeof authorization !== 'string') return { authUser: '', authPass: '' }
  const match = /^Basic\s+(.+)$/.exec(authorization.trim())
  if (match === null) return { authUser: '', authPass: '' }
  const encoded = match[1]
  if (encoded === undefined) return { authUser: '', authPass: '' }
  const decoded = decodeBasicAuth(encoded.trim())
  if (decoded === undefined) return { authUser: '', authPass: '' }
  const separator = decoded.indexOf(':')
  return separator === -1
    ? { authUser: decoded, authPass: '' }
    : { authUser: decoded.slice(0, separator), authPass: decoded.slice(separator + 1) }
}

/**
 * Encode one credential pair for the `Authorization` header.
 *
 * Not `btoa(user + ':' + pass)`: `btoa` throws on every code point above
 * U+00FF, and a password is exactly where a non-Latin-1 character turns up.
 * The bytes are UTF-8 first, which is what RFC 7617 asks a server to expect.
 * @param user - the username as typed.
 * @param pass - the password as typed.
 * @returns the header value, without the `Basic ` prefix.
 */
export function encodeBasicAuth(user: string, pass: string): string {
  const bytes = new TextEncoder().encode(`${user}:${pass}`)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Whether two engine selections are equal, ignoring order. */
export function sameEngines(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((engine) => set.has(engine))
}

/** Render a stored count as a field value; a missing count reads as empty. */
function countValue(value: number | undefined): string {
  return value === undefined ? '' : String(value)
}

/** The count fields, as `[draft key, wire key]`. */
const COUNT_FIELDS = [
  ['timeoutMs', 'timeoutMs'],
  ['maxSnippetChars', 'maxSnippetChars'],
  ['fetchTimeoutMs', 'fetchTimeoutMs'],
] as const

/** The boolean fields the card edits. */
const TOGGLE_FIELDS = ['extract', 'extractFullPage', 'extractUseLlmsTxt'] as const

/** A boolean field's key in both the draft and the wire section. */
export type ToggleField = (typeof TOGGLE_FIELDS)[number]

/** A string field the card edits directly. */
export type TextField = 'baseURL' | 'authUser' | 'authPass' | 'timeoutMs' | 'maxSnippetChars' | 'fetchTimeoutMs'

/**
 * What one save would write.
 *
 * `patch` carries the fields whose draft differs from storage; `unset` names
 * the fields the user emptied, which the host applies as user-layer removals
 * so the value re-inherits the composition base and the schema default. The two
 * are planned together because "cleared" is only meaningful against what is
 * stored: a field the card never touched must not appear in either list.
 */
export interface ConfigWrite {
  readonly patch: Record<string, unknown>
  readonly unset: readonly string[]
}

/**
 * Plan the write a save would perform, and by construction decide dirtiness.
 *
 * One function rather than a `isDirty` predicate plus a `buildPatch` function:
 * two implementations drift, and the failure mode is a save that writes
 * something the "unsaved" indicator never promised (or promises an edit it then
 * refuses to write).
 * @param state - the card's current stored/draft pair.
 * @returns the patch and the removal list; both empty means nothing to save.
 */
export function planSave(state: OpenserpCardState): ConfigWrite {
  const { draft, stored } = state
  const patch: Record<string, unknown> = {}
  const unset: string[] = []

  const baseURL = draft.baseURL.trim()
  if (baseURL !== stored.baseURL) {
    if (baseURL.length === 0) unset.push('baseURL')
    else patch['baseURL'] = baseURL
  }

  if (!sameEngines(draft.engines, stored.engines)) {
    // An empty selection is not "no engines"; it is "let the instance decide",
    // so it clears the override rather than storing an empty array.
    if (draft.engines.length === 0) unset.push('engines')
    else patch['engines'] = [...draft.engines]
  }

  for (const [key] of COUNT_FIELDS) {
    const typed = draft[key].trim()
    if (typed === stored[key]) continue
    if (typed.length === 0) unset.push(key)
    else patch[key] = Number(typed)
  }

  for (const key of TOGGLE_FIELDS) {
    if (draft[key] !== stored[key]) patch[key] = draft[key]
  }

  if (draft.extractMode !== stored.extractMode) {
    if (draft.extractMode === '') unset.push('extractMode')
    else patch['extractMode'] = draft.extractMode
  }

  if (draft.authUser !== stored.authUser || draft.authPass !== stored.authPass) {
    // The whole headers object is rebuilt from what is stored minus the old
    // credential, so the write replaces exactly one key and carries every
    // header the card does not show unchanged.
    const { Authorization: _stored, ...kept } = state.storedHeaders
    const headers: Record<string, string> = { ...kept }
    if (draft.authUser !== '' || draft.authPass !== '') {
      headers['Authorization'] = `Basic ${encodeBasicAuth(draft.authUser, draft.authPass)}`
    }
    if (Object.keys(headers).length === 0) unset.push('headers')
    else patch['headers'] = headers
  }

  return { patch, unset }
}

/** Whether a draft differs from what the host stores. */
export function isDirty(state: OpenserpCardState): boolean {
  const { patch, unset } = planSave(state)
  return Object.keys(patch).length > 0 || unset.length > 0
}

/**
 * Accept only an absolute http(s) URL, or empty (meaning "inherit").
 *
 * The instance rejects a malformed *path* loudly but accepts any well-formed
 * URL, so a typo in the address surfaces only as a failing search much later.
 * Catching it at the form is the earliest honest moment.
 * @param value - the draft URL.
 * @returns true when the value is usable.
 */
export function isValidBaseURL(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return true
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

/**
 * Accept a positive whole number, or empty (meaning "inherit").
 *
 * The schema would reject `0` and `1.5` too, but only after the write, as an
 * opaque refusal; a form that says which field is wrong before submitting is
 * the point of validating here.
 * @param value - the draft count.
 * @returns true when the value is usable.
 */
export function isValidCount(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return true
  return /^\d+$/.test(trimmed) && Number(trimmed) >= 1
}

/** Whether every field the card validates would be accepted by a save. */
export function isSavable(state: OpenserpCardState): boolean {
  return (
    isValidBaseURL(state.draft.baseURL) &&
    isValidCount(state.draft.timeoutMs) &&
    isValidCount(state.draft.maxSnippetChars) &&
    isValidCount(state.draft.fetchTimeoutMs)
  )
}

/**
 * What one endpoint call resolves to. The channel hands back the result
 * envelope rather than the value: a refused write (an unknown key, a wrong
 * type) is `ok: false` with the host's message, NOT a thrown error, so a caller
 * that forgets to unwrap silently reads `undefined` for every field instead of
 * failing. That mistake renders as an empty, read-only card.
 */
export interface RpcResult {
  ok: boolean
  value?: unknown
  error?: { message?: string }
}

/** Minimal shape of the connection's plugin-endpoint channel. */
export interface RpcChannel {
  call(path: string, method: string, payload: unknown): Promise<RpcResult>
}

/**
 * Unwrap one endpoint result, turning a refusal into a throw.
 * @param result - the envelope the channel returned.
 * @returns the host's settings view.
 */
function unwrap(result: RpcResult): OpenserpSettingsView {
  if (!result.ok) throw new Error(result.error?.message ?? 'the request was refused')
  const value = result.value
  if (typeof value !== 'object' || value === null) {
    throw new Error('the endpoint returned no settings view')
  }
  return value as OpenserpSettingsView
}

/** Owns the card's state and the three gateway calls. */
export class OpenserpSettingsController {
  readonly store = createSnapshotStore<OpenserpCardState>(EMPTY)

  constructor(private readonly rpc: RpcChannel) {}

  /** Read the section and reset drafts to it. */
  async load(): Promise<void> {
    try {
      this.adopt(unwrap(await this.rpc.call('/api', 'web-search-openserp/get', { args: {} })))
    } catch (error) {
      this.store.update((state) => {
        state.status = 'failed'
        state.error = error instanceof Error ? error.message : String(error)
      })
    }
  }

  /** Stage a text or number field without writing it. */
  edit(field: TextField, value: string): void {
    this.store.update((state) => {
      state.draft[field] = value
    })
  }

  /** Stage the extraction mode. */
  editExtractMode(value: '' | ExtractMode): void {
    this.store.update((state) => {
      state.draft.extractMode = value
    })
  }

  /** Flip one boolean field in the draft. */
  toggle(field: ToggleField, value: boolean): void {
    this.store.update((state) => {
      state.draft[field] = value
    })
  }

  /** Toggle one engine in the draft selection. */
  toggleEngine(engine: string): void {
    this.store.update((state) => {
      const { engines } = state.draft
      state.draft.engines = engines.includes(engine)
        ? engines.filter((value) => value !== engine)
        : [...engines, engine]
    })
  }

  /** Drop staged edits. */
  discard(): void {
    this.store.update((state) => {
      state.draft = { ...state.stored, engines: [...state.stored.engines] }
    })
  }

  /** Write the staged fields. */
  async save(): Promise<void> {
    const snapshot = this.store.getSnapshot()
    if (!isSavable(snapshot)) return
    const { patch, unset } = planSave(snapshot)
    if (Object.keys(patch).length === 0 && unset.length === 0) return
    this.store.update((state) => {
      state.saving = true
      state.error = undefined
    })
    try {
      this.adopt(
        unwrap(
          await this.rpc.call('/api', 'web-search-openserp/set', {
            args: { patch, unset: [...unset] },
          }),
        ),
      )
    } catch (error) {
      this.store.update((state) => {
        state.saving = false
        state.error = error instanceof Error ? error.message : String(error)
      })
    }
  }

  /** Clear the user layer so the section re-inherits composition defaults. */
  async reset(): Promise<void> {
    this.store.update((state) => {
      state.saving = true
      state.error = undefined
    })
    try {
      this.adopt(unwrap(await this.rpc.call('/api', 'web-search-openserp/reset', { args: {} })))
    } catch (error) {
      this.store.update((state) => {
        state.saving = false
        state.error = error instanceof Error ? error.message : String(error)
      })
    }
  }

  /** Fold one host view into state, clearing drafts and transient flags. */
  private adopt(view: OpenserpSettingsView): void {
    const value = view.value
    const headers = value.headers ?? {}
    const stored: OpenserpDraft = {
      baseURL: value.baseURL ?? '',
      engines: Array.isArray(value.engines) ? [...value.engines] : [],
      timeoutMs: countValue(value.timeoutMs),
      maxSnippetChars: countValue(value.maxSnippetChars),
      extract: value.extract ?? false,
      fetchTimeoutMs: countValue(value.fetchTimeoutMs),
      extractMode: value.extractMode ?? '',
      extractFullPage: value.extractFullPage ?? false,
      extractUseLlmsTxt: value.extractUseLlmsTxt ?? false,
      ...basicAuthFromHeaders(headers),
    }
    this.store.update((state) => {
      state.status = 'ready'
      state.error = undefined
      state.saving = false
      state.stored = stored
      state.draft = { ...stored, engines: [...stored.engines] }
      state.storedHeaders = { ...headers }
      state.effectiveBaseURL = view.effectiveBaseURL
      state.baseURLSource = view.baseURLSource
      state.baseURLEnvVar = view.baseURLEnvVar
      state.writable = view.writable
    })
  }
}
