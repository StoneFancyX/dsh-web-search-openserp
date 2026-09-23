/**
 * The plugin's configuration vocabulary: the schema a settings surface renders,
 * the namespace it is stored under, and the projection into provider options.
 *
 * One section drives BOTH capabilities — search and fetch — because both talk
 * to the same instance and share its URL and auth header. Splitting them would
 * force a deployment to configure the same endpoint twice.
 *
 * @module dsh-web-search-openserp/config
 */
import z from '@deepseek-ai/schemastery';
import { OPENSERP_DEFAULT_MAX_SNIPPET_CHARS, OPENSERP_DEFAULT_TIMEOUT_MS, } from './provider.js';
import { OPENSERP_DEFAULT_FETCH_TIMEOUT_MS, } from './fetch.js';
/**
 * Environment variable naming the instance, used when `baseURL` is omitted.
 * `OPENSERP_URL` mirrors the `SEARXNG_URL` convention the wider tooling uses,
 * so a deployment can point either provider at its instance the same way.
 */
export const OPENSERP_BASE_URL_ENV = 'OPENSERP_URL';
/**
 * The settings namespace this plugin owns. Its section resolves as
 * schema defaults → the plugin row's `config` (composition base) → the user
 * layer in the harness settings document.
 */
export const OPENSERP_SETTINGS_NAMESPACE = 'web-search-openserp';
export const Config = z.object({
    baseURL: z.string(),
    engines: z.array(z.string()),
    timeoutMs: z.number().step(1).min(1).default(OPENSERP_DEFAULT_TIMEOUT_MS),
    maxSnippetChars: z.number().step(1).min(1).default(OPENSERP_DEFAULT_MAX_SNIPPET_CHARS),
    extract: z.boolean().default(false),
    fetchTimeoutMs: z.number().step(1).min(1).default(OPENSERP_DEFAULT_FETCH_TIMEOUT_MS),
    extractMode: z.union(['auto', 'fast', 'rendered']),
    extractFullPage: z.boolean().default(false),
    extractUseLlmsTxt: z.boolean().default(false),
    headers: z.dict(z.string()),
});
/** Every key the schema declares; the gate a patch from the wire must pass. */
export const CONFIG_KEYS = [
    'baseURL',
    'engines',
    'timeoutMs',
    'maxSnippetChars',
    'extract',
    'fetchTimeoutMs',
    'extractMode',
    'extractFullPage',
    'extractUseLlmsTxt',
    'headers',
];
/**
 * Resolve the effective instance URL and say which layer supplied it.
 *
 * A configuration surface needs the distinction: a deployment whose URL comes
 * from `$OPENSERP_URL` shows an empty field that is nonetheless working, and
 * saying "unset" there would be a lie.
 * @param config - the currently authoritative section.
 * @returns the effective URL (when any) and its origin.
 */
export function resolveBaseURL(config) {
    const configured = config.baseURL;
    if (configured !== undefined && configured.length > 0) {
        return { baseURL: configured, source: 'settings' };
    }
    const ambient = process.env[OPENSERP_BASE_URL_ENV];
    if (ambient !== undefined && ambient.length > 0)
        return { baseURL: ambient, source: 'environment' };
    return { baseURL: undefined, source: 'none' };
}
/**
 * Project one resolved settings section into SEARCH provider options.
 *
 * The `$OPENSERP_URL` fallback is applied HERE rather than once at `apply`, so
 * clearing `baseURL` in the settings document falls back to the environment
 * again instead of stranding the provider on a value it can no longer see.
 * @param config - the currently authoritative section.
 * @returns options for one search operation.
 */
export function resolveOptions(config) {
    const { baseURL } = resolveBaseURL(config);
    return {
        ...(baseURL === undefined ? {} : { baseURL }),
        ...(config.engines === undefined ? {} : { engines: config.engines }),
        ...(config.headers === undefined ? {} : { headers: config.headers }),
        timeoutMs: config.timeoutMs ?? OPENSERP_DEFAULT_TIMEOUT_MS,
        maxSnippetChars: config.maxSnippetChars ?? OPENSERP_DEFAULT_MAX_SNIPPET_CHARS,
        extract: config.extract ?? false,
    };
}
/**
 * Project one resolved settings section into FETCH provider options.
 *
 * Separate from {@link resolveOptions} rather than one combined projection:
 * the two option bags share `baseURL` and `headers` but nothing else, and a
 * single bag would let a search knob silently reach the fetch path.
 * @param config - the currently authoritative section.
 * @returns options for one fetch operation.
 */
export function resolveFetchOptions(config) {
    const { baseURL } = resolveBaseURL(config);
    return {
        ...(baseURL === undefined ? {} : { baseURL }),
        ...(config.headers === undefined ? {} : { headers: config.headers }),
        timeoutMs: config.fetchTimeoutMs ?? OPENSERP_DEFAULT_FETCH_TIMEOUT_MS,
        mode: config.extractMode ?? 'auto',
        fullPage: config.extractFullPage ?? false,
        useLlmsTxt: config.extractUseLlmsTxt ?? false,
    };
}
