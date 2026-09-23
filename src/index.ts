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
 * Register the OpenSERP search provider with `ctx.web`, reading its
 * configuration through the harness settings seam when one is mounted.
 *
 * `installSettingsSection` registers {@link OPENSERP_SETTINGS_NAMESPACE} with
 * this plugin row's `config` as the composition `base`, and points the source
 * thunk at the resolved scope. When no settings service is mounted — or one
 * goes away on reload — the thunk falls back to the composition entry, so the
 * plugin behaves exactly as composed. Nothing here is conditional on a provider
 * existing.
 *
 * The provider receives the thunk rather than a snapshot, so a settings edit
 * reaches the NEXT search without a restart while the registration stays put.
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
 * @param config - this plugin row's composition entry config.
 */
export function apply(ctx: Context, config: Config): void {
  let current = (): Config => config
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, OPENSERP_SETTINGS_NAMESPACE, Config, config, {
      setSource: (source) => {
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
