/**
 * Host-side configuration gateway: the `/api/web-search-openserp/get|set|reset`
 * endpoints a browser half calls to read and edit this plugin's settings.
 *
 * Why a plugin-owned gateway rather than the generic settings API: the API
 * proxy serves `settings.describe`/`settings.update` only for an explicit
 * allowlist (`exposedNamespaces()` — model providers plus the product's own
 * namespaces), and its comment is deliberate: "a future registration does not
 * become remotely readable or writable by default". A third-party namespace is
 * therefore unreachable from the browser through that route. The wire-level
 * gate guards the proxy path only, so an in-process `ctx.settings` write from
 * this plugin's own endpoint is the sanctioned way in — the same one
 * `dsh-llm-fallbacks` uses.
 *
 * Why `ctx.typert.register(...)` rather than `@Remote` markers: SRC discovery
 * reads a module-private WeakMap inside `@deepseek-ai/dsh-typert-protocol`, and
 * a plugin installed into the profile does not share that table with the host's
 * typert gateway — the endpoints would claim nothing and answer 404. The
 * explicit registry path writes invocation descriptors into `ctx.typert.local`,
 * which claim resolution checks first, so it works regardless of module
 * identity.
 *
 * Why this gateway writes with `mutate` rather than the sibling plugin's
 * `update`: a merge patch cannot express removal. The settings service's write
 * sanitizer strips `undefined` object entries before persistence (its
 * `mergeLayers` note: "a sparse patch cannot erase lower keys"), so sending a
 * cleared field as `undefined` leaves the previous override in place and the
 * field silently never re-inherits. Path ops are the removal path — and they
 * also make `headers` a whole-value replacement, which is what one card-level
 * control over that object actually means.
 *
 * @module dsh-web-search-openserp/gateway
 */
import type { Context } from '@deepseek-ai/cordis';
import '@deepseek-ai/dsh-settings';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry';
import { Config } from './config.js';
import type { BaseUrlSource } from './config.js';
/** Cordis service key, and the wire namespace the endpoints are mounted under. */
export declare const OPENSERP_GATEWAY_SERVICE = "webSearchOpenserp";
/** Wire namespace: `/api/web-search-openserp/<method>`. */
export declare const OPENSERP_GATEWAY_NAMESPACE = "web-search-openserp";
/** What one gateway read hands a configuration surface. */
export interface OpenserpSettingsView {
    /** The resolved section: schema defaults → composition base → user layer. */
    readonly value: Config;
    /** The instance URL actually in force, after the environment fallback. */
    readonly effectiveBaseURL?: string;
    /** Which layer supplied {@link effectiveBaseURL}. */
    readonly baseURLSource: BaseUrlSource;
    /** Name of the environment variable consulted when no layer sets `baseURL`. */
    readonly baseURLEnvVar: string;
    /** False when no settings provider is mounted, or it is read-only. */
    readonly writable: boolean;
}
/**
 * Reject a patch the settings service would otherwise merge through.
 *
 * The settings service is non-strict: an unknown key would be stored and then
 * silently ignored forever, which reads to a user as "the setting did nothing".
 * Validating against the schema also rejects a wrong-typed value before it
 * reaches storage.
 * @param patch - candidate partial section from the wire.
 */
export declare function validateConfigPatch(patch: unknown): asserts patch is Partial<Config>;
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
export declare function validateUnsetKeys(unset: unknown): string[];
/**
 * The `web-search-openserp` configuration endpoints.
 *
 * The class extends {@link TypertRemoteService} only for its `typertRemote`
 * binding, which the gateway's dispatch requires on the live service; the
 * endpoints themselves are declared by {@link openserpTypertContribution}.
 */
export declare class OpenserpConfigGateway extends TypertRemoteService {
    private readonly current;
    /** Live settings seam while one is mounted; `undefined` otherwise. */
    private settings;
    /**
     * @param ctx - plugin context owning this service.
     * @param current - thunk returning the currently authoritative section.
     */
    constructor(ctx: Context, current: () => Config);
    /** Read the section as the runtime currently sees it. */
    get(): OpenserpSettingsView;
    /**
     * Apply one card save: set the fields it carries, clear the fields it names.
     * @param patch - partial section; unknown or wrong-typed keys are refused.
     * @param unset - top-level keys to remove from the user layer, which is how a
     *   field returns to the composition base and the schema default.
     * @returns the section as it stands after the write.
     */
    set(patch: unknown, unset?: unknown): Promise<OpenserpSettingsView>;
    /**
     * Clear the user layer so the section re-inherits the composition base and
     * schema defaults. `set` could express this key by key, but not as one
     * operation, and not without the card enumerating every key it knows.
     * @returns the section as it stands after the reset.
     */
    reset(): Promise<OpenserpSettingsView>;
    /** The settings seam, or a diagnostic naming why configuration cannot be written. */
    private requireSettings;
    /** Project the live section into the wire view. */
    private view;
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
export declare function openserpTypertContribution(): TypertContribution;
