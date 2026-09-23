import '@deepseek-ai/dsh-settings';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { CONFIG_KEYS, Config, OPENSERP_SETTINGS_NAMESPACE, resolveBaseURL } from './config.js';
/** Cordis service key, and the wire namespace the endpoints are mounted under. */
export const OPENSERP_GATEWAY_SERVICE = 'webSearchOpenserp';
/** Wire namespace: `/api/web-search-openserp/<method>`. */
export const OPENSERP_GATEWAY_NAMESPACE = 'web-search-openserp';
/**
 * Reject a patch the settings service would otherwise merge through.
 *
 * The settings service is non-strict: an unknown key would be stored and then
 * silently ignored forever, which reads to a user as "the setting did nothing".
 * Validating against the schema also rejects a wrong-typed value before it
 * reaches storage.
 * @param patch - candidate partial section from the wire.
 */
export function validateConfigPatch(patch) {
    if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
        throw new Error('web-search-openserp: patch must be an object');
    }
    const unknown = Object.keys(patch).filter((key) => !CONFIG_KEYS.includes(key));
    if (unknown.length > 0) {
        throw new Error(`web-search-openserp: unknown setting(s): ${unknown.join(', ')}`);
    }
    // Schemastery schemas are callable validators; a wrong type throws here.
    Config(patch);
}
/**
 * Read the keys a card asked to clear.
 *
 * Clearing is a separate list rather than "a patch key present with no value":
 * JSON has no `undefined`, so a cleared field would arrive as an absent key and
 * be indistinguishable from one the form never touched. Naming the removals
 * explicitly is also what lets the write stay one atomic operation.
 * @param unset - candidate key list from the wire; omitted means "nothing to clear".
 * @returns the validated keys, in wire order.
 */
export function validateUnsetKeys(unset) {
    if (unset === undefined || unset === null)
        return [];
    if (!Array.isArray(unset)) {
        throw new Error('web-search-openserp: unset must be an array of setting keys');
    }
    return unset.map((key) => {
        if (typeof key !== 'string') {
            throw new Error('web-search-openserp: unset entries must be strings');
        }
        if (!CONFIG_KEYS.includes(key)) {
            throw new Error(`web-search-openserp: unknown setting to clear: ${key}`);
        }
        return key;
    });
}
/**
 * The `web-search-openserp` configuration endpoints.
 *
 * The class extends {@link TypertRemoteService} only for its `typertRemote`
 * binding, which the gateway's dispatch requires on the live service; the
 * endpoints themselves are declared by {@link openserpTypertContribution}.
 */
export class OpenserpConfigGateway extends TypertRemoteService {
    current;
    /** Live settings seam while one is mounted; `undefined` otherwise. */
    settings;
    /**
     * @param ctx - plugin context owning this service.
     * @param current - thunk returning the currently authoritative section.
     */
    constructor(ctx, current) {
        super(ctx, OPENSERP_GATEWAY_SERVICE, { namespace: OPENSERP_GATEWAY_NAMESPACE });
        this.current = current;
        ctx.inject(['settings'], (sctx) => {
            this.settings = sctx.settings;
            return () => {
                this.settings = undefined;
            };
        });
    }
    /** Read the section as the runtime currently sees it. */
    get() {
        return this.view();
    }
    /**
     * Apply one card save: set the fields it carries, clear the fields it names.
     * @param patch - partial section; unknown or wrong-typed keys are refused.
     * @param unset - top-level keys to remove from the user layer, which is how a
     *   field returns to the composition base and the schema default.
     * @returns the section as it stands after the write.
     */
    async set(patch, unset) {
        validateConfigPatch(patch);
        const cleared = validateUnsetKeys(unset);
        const entries = Object.entries(patch);
        if (entries.length === 0 && cleared.length === 0)
            return this.view();
        // One mutate call, not one update plus one removal: the ops apply in order
        // to the section as it stands when the write reaches the front of the
        // queue, so the card's save is a single revision a reader can never observe
        // half-applied.
        const ops = [
            ...entries.map(([key, value]) => ({ op: 'set', path: [key], value })),
            ...cleared.map((key) => ({ op: 'unset', path: [key] })),
        ];
        await this.requireSettings().mutate(OPENSERP_SETTINGS_NAMESPACE, ops);
        return this.view();
    }
    /**
     * Clear the user layer so the section re-inherits the composition base and
     * schema defaults. `set` could express this key by key, but not as one
     * operation, and not without the card enumerating every key it knows.
     * @returns the section as it stands after the reset.
     */
    async reset() {
        await this.requireSettings().replace(OPENSERP_SETTINGS_NAMESPACE, {});
        return this.view();
    }
    /** The settings seam, or a diagnostic naming why configuration cannot be written. */
    requireSettings() {
        const settings = this.settings;
        if (settings === undefined) {
            throw new Error('web-search-openserp: settings service is unavailable — configuration cannot be written');
        }
        return settings;
    }
    /** Project the live section into the wire view. */
    view() {
        const value = this.current();
        const { baseURL, source } = resolveBaseURL(value);
        return {
            value,
            ...(baseURL === undefined ? {} : { effectiveBaseURL: baseURL }),
            baseURLSource: source,
            baseURLEnvVar: 'OPENSERP_URL',
            writable: this.settings?.writable ?? false,
        };
    }
}
/**
 * The invocation descriptors claiming `/api/web-search-openserp/*`.
 *
 * Registered explicitly through `ctx.typert.register` — see the module note on
 * why the decorator path cannot work for a profile-installed plugin. The
 * payload contract is one plain-object `args` field keyed by parameter name:
 * `get()` → `{ args: {} }`, `set(patch, unset)` → `{ args: { patch, unset } }`.
 * An `src-json` parameter may be absent from the payload, which is what keeps
 * `unset` optional on the wire.
 * @returns the contribution to hand `ctx.typert.register`.
 */
export function openserpTypertContribution() {
    const jsonParameter = (name) => ({
        name,
        wire: name,
        source: 'json',
        codec: { mode: 'src-json' },
    });
    const invocation = (method, parameters) => ({
        id: `dsh-web-search-openserp#${OPENSERP_GATEWAY_NAMESPACE}/${method}`,
        service: OPENSERP_GATEWAY_SERVICE,
        namespace: OPENSERP_GATEWAY_NAMESPACE,
        method,
        invocation: { kind: 'direct' },
        parameters,
        result: { mode: 'src-json' },
    });
    return {
        package: 'dsh-web-search-openserp',
        face: 'host',
        schemas: [],
        model: { services: [], events: [], objects: [] },
        invocations: [
            invocation('get', []),
            invocation('set', [jsonParameter('patch'), jsonParameter('unset')]),
            invocation('reset', []),
        ],
    };
}
