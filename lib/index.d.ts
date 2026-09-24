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
import type { Context } from '@deepseek-ai/cordis';
import '@deepseek-ai/dsh-settings';
import { Config } from './config.js';
export { OPENSERP_DEFAULT_MAX_SNIPPET_CHARS, OPENSERP_DEFAULT_TIMEOUT_MS, OPENSERP_KNOWN_ENGINES, OPENSERP_PROVIDER_ID, OpenserpSearchProvider, isAdURL, isNonResultType, mapOpenserpResponse, } from './provider.js';
export type { OpenserpSearchProviderOptions } from './provider.js';
export { OPENSERP_DEFAULT_FETCH_TIMEOUT_MS, OPENSERP_FETCH_PROVIDER_ID, OpenserpFetchProvider, } from './fetch.js';
export type { OpenserpExtractMode, OpenserpFetchProviderOptions } from './fetch.js';
export { Config, CONFIG_KEYS, OPENSERP_BASE_URL_ENV, OPENSERP_SETTINGS_NAMESPACE, resolveBaseURL, resolveFetchOptions, resolveOptions, } from './config.js';
export type { BaseUrlSource } from './config.js';
export { OPENSERP_GATEWAY_NAMESPACE, OPENSERP_GATEWAY_SERVICE, OpenserpConfigGateway, openserpTypertContribution, validateConfigPatch, validateUnsetKeys, } from './gateway.js';
export type { OpenserpSettingsView } from './gateway.js';
/** Cordis plugin name used by loader diagnostics. */
export declare const name = "web-search-openserp";
/** The web seam this provider registers into. */
export declare const inject: string[];
/**
 * One config field as {@link apply} receives it.
 *
 * The two supported harness lines hand the same field in different shapes:
 * 0.1.5 passes a plain object, while 0.1.7 drops the settings service's
 * namespace registration — the harness wires a plugin row's config itself — and
 * passes each field as a signal, read with `.get()` at the moment of use rather
 * than snapshotted once at `apply`.
 */
type ConfigField<T> = T | {
    get(): T;
};
/** This plugin row's config, in whichever shape the running harness uses. */
export type ApplyConfig = {
    [K in keyof Config]: ConfigField<Config[K]>;
};
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
export declare function apply(ctx: Context, config: ApplyConfig): void;
