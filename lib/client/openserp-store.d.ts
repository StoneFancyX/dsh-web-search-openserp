/** Mirrors `OpenserpExtractMode` in `src/fetch.ts`. */
export type ExtractMode = 'auto' | 'fast' | 'rendered';
/**
 * The engines the card offers, in the host's own order (`OPENSERP_KNOWN_ENGINES`).
 *
 * Mirrored rather than imported for the bundle reason in the module note.
 * `bing` stays on the list because the instance can address it, but the host's
 * documented default set excludes it: measured against a Chinese query it
 * returned unrelated results, so it costs a slot without adding signal.
 */
export declare const ENGINE_CHOICES: readonly [{
    readonly value: "baidu";
    readonly label: "百度";
}, {
    readonly value: "google";
    readonly label: "Google";
}, {
    readonly value: "duckduckgo";
    readonly label: "DuckDuckGo";
}, {
    readonly value: "bing";
    readonly label: "必应（Bing）";
}, {
    readonly value: "yandex";
    readonly label: "Yandex";
}, {
    readonly value: "ecosia";
    readonly label: "Ecosia";
}];
/** The `/extract` modes the card offers, in escalating cost order. */
export declare const EXTRACT_MODE_CHOICES: readonly [{
    readonly value: "";
    readonly labelKey: "extractMode.inherit";
}, {
    readonly value: "auto";
    readonly labelKey: "extractMode.auto";
}, {
    readonly value: "fast";
    readonly labelKey: "extractMode.fast";
}, {
    readonly value: "rendered";
    readonly labelKey: "extractMode.rendered";
}];
/** Where the effective instance URL came from. Mirrors the host view. */
export type BaseUrlSource = 'settings' | 'environment' | 'none';
/** The host gateway's read view. */
export interface OpenserpSettingsView {
    value: {
        baseURL?: string;
        engines?: string[];
        timeoutMs?: number;
        maxSnippetChars?: number;
        extract?: boolean;
        fetchTimeoutMs?: number;
        extractMode?: ExtractMode;
        extractFullPage?: boolean;
        extractUseLlmsTxt?: boolean;
        headers?: Record<string, string>;
    };
    effectiveBaseURL?: string;
    baseURLSource: BaseUrlSource;
    baseURLEnvVar: string;
    writable: boolean;
}
/** The editable credential pair. */
export interface BasicAuth {
    authUser: string;
    authPass: string;
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
    baseURL: string;
    engines: string[];
    timeoutMs: string;
    maxSnippetChars: string;
    extract: boolean;
    fetchTimeoutMs: string;
    extractMode: '' | ExtractMode;
    extractFullPage: boolean;
    extractUseLlmsTxt: boolean;
    authUser: string;
    authPass: string;
}
/** Everything the card renders from. */
export interface OpenserpCardState {
    status: 'loading' | 'ready' | 'failed';
    /** Failure text from the last load, or `undefined` while healthy. */
    error?: string | undefined;
    /** Stored values, as the host last reported them. */
    stored: OpenserpDraft;
    /** What the user has typed but not saved. */
    draft: OpenserpDraft;
    /**
     * The stored `headers` map in full. Only the Basic Auth pair is editable, so
     * this is what keeps a deployment's other headers (an API key for a
     * reverse proxy, say) from being deleted by an unrelated save.
     */
    storedHeaders: Record<string, string>;
    effectiveBaseURL?: string | undefined;
    baseURLSource: BaseUrlSource;
    baseURLEnvVar: string;
    writable: boolean;
    saving: boolean;
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
export declare function basicAuthFromHeaders(headers: Record<string, string> | undefined): BasicAuth;
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
export declare function encodeBasicAuth(user: string, pass: string): string;
/** Whether two engine selections are equal, ignoring order. */
export declare function sameEngines(a: readonly string[], b: readonly string[]): boolean;
/** The boolean fields the card edits. */
declare const TOGGLE_FIELDS: readonly ["extract", "extractFullPage", "extractUseLlmsTxt"];
/** A boolean field's key in both the draft and the wire section. */
export type ToggleField = (typeof TOGGLE_FIELDS)[number];
/** A string field the card edits directly. */
export type TextField = 'baseURL' | 'authUser' | 'authPass' | 'timeoutMs' | 'maxSnippetChars' | 'fetchTimeoutMs';
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
    readonly patch: Record<string, unknown>;
    readonly unset: readonly string[];
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
export declare function planSave(state: OpenserpCardState): ConfigWrite;
/** Whether a draft differs from what the host stores. */
export declare function isDirty(state: OpenserpCardState): boolean;
/**
 * Accept only an absolute http(s) URL, or empty (meaning "inherit").
 *
 * The instance rejects a malformed *path* loudly but accepts any well-formed
 * URL, so a typo in the address surfaces only as a failing search much later.
 * Catching it at the form is the earliest honest moment.
 * @param value - the draft URL.
 * @returns true when the value is usable.
 */
export declare function isValidBaseURL(value: string): boolean;
/**
 * Accept a positive whole number, or empty (meaning "inherit").
 *
 * The schema would reject `0` and `1.5` too, but only after the write, as an
 * opaque refusal; a form that says which field is wrong before submitting is
 * the point of validating here.
 * @param value - the draft count.
 * @returns true when the value is usable.
 */
export declare function isValidCount(value: string): boolean;
/** Whether every field the card validates would be accepted by a save. */
export declare function isSavable(state: OpenserpCardState): boolean;
/**
 * What one endpoint call resolves to. The channel hands back the result
 * envelope rather than the value: a refused write (an unknown key, a wrong
 * type) is `ok: false` with the host's message, NOT a thrown error, so a caller
 * that forgets to unwrap silently reads `undefined` for every field instead of
 * failing. That mistake renders as an empty, read-only card.
 */
export interface RpcResult {
    ok: boolean;
    value?: unknown;
    error?: {
        message?: string;
    };
}
/** Minimal shape of the connection's plugin-endpoint channel. */
export interface RpcChannel {
    call(path: string, method: string, payload: unknown): Promise<RpcResult>;
}
/** Owns the card's state and the three gateway calls. */
export declare class OpenserpSettingsController {
    private readonly rpc;
    readonly store: import("@deepseek-ai/dsh-client-store").SnapshotStore<OpenserpCardState>;
    constructor(rpc: RpcChannel);
    /** Read the section and reset drafts to it. */
    load(): Promise<void>;
    /** Stage a text or number field without writing it. */
    edit(field: TextField, value: string): void;
    /** Stage the extraction mode. */
    editExtractMode(value: '' | ExtractMode): void;
    /** Flip one boolean field in the draft. */
    toggle(field: ToggleField, value: boolean): void;
    /** Toggle one engine in the draft selection. */
    toggleEngine(engine: string): void;
    /** Drop staged edits. */
    discard(): void;
    /** Write the staged fields. */
    save(): Promise<void>;
    /** Clear the user layer so the section re-inherits composition defaults. */
    reset(): Promise<void>;
    /** Fold one host view into state, clearing drafts and transient flags. */
    private adopt;
}
export {};
