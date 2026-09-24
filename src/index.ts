/**
 * Register an OpenSERP-backed search provider in `ctx.web`.
 *
 * OpenSERP is a self-hosted SERP API that renders each engine in a real
 * headless browser. One search is a plain retrieval call against the instance,
 * so unlike the shipped DeepSeek provider it costs no model turn and needs no
 * API key.
 *
 * This is an implementation package: it registers a provider and does NOT
 * register a model-facing tool. `@deepseek-ai/dsh-tool-web` owns `web_search`.
 *
 * @module dsh-web-search-openserp
 */
import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-settings'
import {
  Config,
  OPENSERP_SETTINGS_NAMESPACE,
  resolveFetchOptions,
  resolveOptions,
} from './config.js'
import { OpenserpFetchProvider } from './fetch.js'
import { OpenserpConfigGateway, openserpTypertContribution } from './gateway.js'
import { OpenserpSearchProvider } from './provider.js'

export {
  OPENSERP_DEFAULT_MAX_SNIPPET_CHARS,
  OPENSERP_DEFAULT_TIMEOUT_MS,
  OPENSERP_KNOWN_ENGINES,
  OPENSERP_PROVIDER_ID,
  OpenserpSearchProvider,
  isAdURL,
  isNonResultType,
  mapOpenserpResponse,
} from './provider.js'
export type { OpenserpSearchProviderOptions } from './provider.js'
export {
  OPENSERP_DEFAULT_FETCH_TIMEOUT_MS,
  OPENSERP_FETCH_PROVIDER_ID,
  OpenserpFetchProvider,
} from './fetch.js'
export type { OpenserpExtractMode, OpenserpFetchProviderOptions } from './fetch.js'
export {
  Config,
  CONFIG_KEYS,
  OPENSERP_BASE_URL_ENV,
  OPENSERP_SETTINGS_NAMESPACE,
  resolveBaseURL,
  resolveFetchOptions,
  resolveOptions,
} from './config.js'
export type { BaseUrlSource } from './config.js'
export {
  OPENSERP_GATEWAY_NAMESPACE,
  OPENSERP_GATEWAY_SERVICE,
  OpenserpConfigGateway,
  openserpTypertContribution,
  validateConfigPatch,
  validateUnsetKeys,
} from './gateway.js'
export type { OpenserpSettingsView } from './gateway.js'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'web-search-openserp'

/** The web seam this provider registers into. */
export const inject = ['web']

/**
 * One config field as {@link apply} receives it.
 *
 * The two supported harness lines hand the same field in different shapes:
 * 0.1.5 passes a plain object, while 0.1.7 drops the settings service's
 * namespace registration — the harness wires a plugin row's config itself — and
 * passes each field as a signal, read with `.get()` at the moment of use rather
 * than snapshotted once at `apply`.
 */
type ConfigField<T> = T | { get(): T }

/** This plugin row's config, in whichever shape the running harness uses. */
export type ApplyConfig = { [K in keyof Config]: ConfigField<Config[K]> }

/**
 * Read one config field as a plain value.
 *
 * Signals are told apart from the values they carry by carrying `.get`; the
 * object test matters because `engines` and `headers` are themselves objects,
 * and `null` is a legal field value that must not be dereferenced.
 * @param field - the field as handed to `apply`.
 * @returns the current plain value.
 */
function readField<T>(field: ConfigField<T>): T {
  if (
    field !== null &&
    typeof field === 'object' &&
    typeof (field as { get?: unknown }).get === 'function'
  ) {
    return (field as { get(): T }).get()
  }
  return field as T
}

/**
 * Snapshot a whole config, whichever shape it arrived in.
 *
 * Taken on every read rather than once: under 0.1.7 the underlying signals move
 * when the user saves the row's config form, and a snapshot captured at `apply`
 * would strand the providers on the values the composition started with.
 *
 * A key the source left undefined is omitted rather than written through.
 * `exactOptionalPropertyTypes` is on, so an explicit `undefined` is not the
 * same as an absent key — and a present `undefined` would shadow the schema
 * default rather than fall through to it.
 * @param config - the config as handed to `apply`.
 * @returns a plain config for one projection.
 */
function readConfig(config: ApplyConfig): Config {
  const baseURL = readField(config.baseURL)
  const engines = readField(config.engines)
  const timeoutMs = readField(config.timeoutMs)
  const maxSnippetChars = readField(config.maxSnippetChars)
  const extract = readField(config.extract)
  const fetchTimeoutMs = readField(config.fetchTimeoutMs)
  const extractMode = readField(config.extractMode)
  const extractFullPage = readField(config.extractFullPage)
  const extractUseLlmsTxt = readField(config.extractUseLlmsTxt)
  const headers = readField(config.headers)
  return {
    ...(baseURL === undefined ? {} : { baseURL }),
    ...(engines === undefined ? {} : { engines }),
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
    ...(maxSnippetChars === undefined ? {} : { maxSnippetChars }),
    ...(extract === undefined ? {} : { extract }),
    ...(fetchTimeoutMs === undefined ? {} : { fetchTimeoutMs }),
    ...(extractMode === undefined ? {} : { extractMode }),
    ...(extractFullPage === undefined ? {} : { extractFullPage }),
    ...(extractUseLlmsTxt === undefined ? {} : { extractUseLlmsTxt }),
    ...(headers === undefined ? {} : { headers }),
  }
}

/**
 * The settings provider's namespace-registration surface, as 0.1.5 declared it.
 *
 * Declared structurally instead of imported: 0.1.7 removed `installSection`
 * from `@deepseek-ai/dsh-settings`, so naming the shipped type here would make
 * this file fail to compile against the newer typings it must also serve. Only
 * the members this plugin calls are named.
 */
interface LegacySettingsProvider {
  /**
   * Register a settings namespace this plugin owns.
   * @param owner - the registering plugin's context.
   * @param ns - the consumer-owned settings namespace.
   * @param schema - schema resolving the namespace.
   * @param entry - composition entry used as the base and fallback value.
   * @param hooks - source sink and change notification. The sink receives the
   *   READER, not a snapshot: the settings service re-points it as the
   *   authoritative layer changes, and the plugin calls it per operation.
   */
  installSection(
    owner: unknown,
    ns: string,
    schema: unknown,
    entry: unknown,
    hooks: { setSource: (source: () => Config) => void; onChange: () => void },
  ): void
}

/**
 * Register the OpenSERP search provider with `ctx.web`, reading its
 * configuration through the harness settings seam when one is mounted.
 *
 * Where 0.1.5 mounts a settings service, `installSection` registers
 * {@link OPENSERP_SETTINGS_NAMESPACE} with this plugin row's `config` as the
 * composition `base` and points the source thunk at the resolved scope. When no
 * settings service is mounted — or one goes away on reload — the thunk falls
 * back to the composition entry, so the plugin behaves exactly as composed.
 * Nothing here is conditional on a provider existing.
 *
 * Where the harness instead wires the row's config itself (0.1.7 onward) there
 * is no section to install and the config arrives as signals; the guard below
 * leaves those authoritative. Either way the providers read through a thunk, so
 * a config edit reaches the NEXT search without a restart while the
 * registration stays put.
 *
 * The configuration gateway is mounted only where a typert registry exists (the
 * web app); a headless composition simply has no browser to serve, so its
 * absence is not an error.
 *
 * The `registerSearchProvider` disposer is deliberately not captured:
 * registration is effect-scoped and unregisters with the calling fiber, so HMR
 * and plugin disposal clean up on their own.
 *
 * @param ctx - plugin context carrying the web seam.
 * @param config - this plugin row's config, as a value or as signals.
 */
export function apply(ctx: Context, config: ApplyConfig): void {
  let current = (): Config => readConfig(config)
  ctx.inject(['settings'], (settingsCtx) => {
    // Structural, not nominal: 0.1.7's settings provider has no
    // `installSection`, and this file must compile against both typings.
    const settings = settingsCtx.settings as unknown as LegacySettingsProvider | undefined
    // Retired namespace registration is not a degraded mount — the row's own
    // config is what the signals already carry — so this returns rather than
    // failing the plugin at activation. Search and fetch do not depend on a
    // settings section existing at all.
    if (typeof settings?.installSection !== 'function') return
    settings.installSection(ctx, OPENSERP_SETTINGS_NAMESPACE, Config, readConfig(config), {
      setSource: (source) => {
        // The sink hands back a reader, so it REPLACES `current` rather than
        // being wrapped in it: wrapping would make `current()` return the
        // reader itself, and every projection would then read fields off a
        // function — `undefined` on the wire, not a config.
        current = source
      },
      // Nothing is memoized from the section: every operation projects it
      // fresh, so there is no derived state to re-judge on a change.
      onChange: () => {},
    })
  })

  ctx.web.registerSearchProvider(new OpenserpSearchProvider(() => resolveOptions(current())))

  // Both capabilities come from the same instance, so registering both here is
  // what makes this one plugin self-sufficient: installing it and naming
  // `openserp` for `searchProvider` and `fetchProvider` leaves no path back to
  // a shipped provider.
  //
  // This fetcher returns `kind: 'text'` only — OpenSERP cleans a page before
  // returning it, so there is no "resource as served" arm to offer. A caller
  // that needs the served markup, or needs to drive a page, belongs in a
  // browser-automation tool instead.
  ctx.web.registerFetchProvider(new OpenserpFetchProvider(() => resolveFetchOptions(current())))

  // Serves the settings card's `/api/web-search-openserp/*` endpoints. The
  // thunk, not a snapshot, so the card reads back exactly what the providers
  // would use — including the `$OPENSERP_URL` fallback the two share.
  ctx.inject(['typert'], (tctx) => {
    tctx.plugin(OpenserpConfigGateway, () => current())
    tctx.typert.register(openserpTypertContribution())
  })
}
