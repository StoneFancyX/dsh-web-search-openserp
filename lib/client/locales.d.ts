/**
 * Card dictionaries. The shell ships zh and en; a key missing from a
 * dictionary falls back to the other, so both are kept complete.
 *
 * Engine names are proper nouns and live as literals in the store's choice
 * list rather than here, the same way the sibling cards treat vendor names.
 *
 * @module dsh-web-search-openserp/client/locales
 */
/** Dictionary namespace this plugin owns. */
export declare const OPENSERP_LOCALE_NS = "web-search-openserp";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    title: string;
    description: string;
    baseURL: string;
    'baseURL.placeholder': string;
    'baseURL.fromEnvironment': string;
    'baseURL.unset': string;
    'baseURL.invalid': string;
    search: string;
    'search.hint': string;
    engines: string;
    'engines.hint': string;
    timeoutMs: string;
    'timeoutMs.hint': string;
    maxSnippetChars: string;
    'maxSnippetChars.hint': string;
    extract: string;
    'extract.hint': string;
    fetch: string;
    'fetch.hint': string;
    fetchTimeoutMs: string;
    'fetchTimeoutMs.hint': string;
    extractMode: string;
    'extractMode.inherit': string;
    'extractMode.auto': string;
    'extractMode.fast': string;
    'extractMode.rendered': string;
    extractFullPage: string;
    'extractFullPage.hint': string;
    extractUseLlmsTxt: string;
    'extractUseLlmsTxt.hint': string;
    'number.invalid': string;
    authUser: string;
    'authUser.placeholder': string;
    authPass: string;
    'authPass.placeholder': string;
    'authPass.show': string;
    'authPass.hide': string;
    'auth.hint': string;
    save: string;
    discard: string;
    reset: string;
    dirty: string;
    saving: string;
    readonly: string;
    loading: string;
    error: string;
};
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    title: string;
    description: string;
    baseURL: string;
    'baseURL.placeholder': string;
    'baseURL.fromEnvironment': string;
    'baseURL.unset': string;
    'baseURL.invalid': string;
    search: string;
    'search.hint': string;
    engines: string;
    'engines.hint': string;
    timeoutMs: string;
    'timeoutMs.hint': string;
    maxSnippetChars: string;
    'maxSnippetChars.hint': string;
    extract: string;
    'extract.hint': string;
    fetch: string;
    'fetch.hint': string;
    fetchTimeoutMs: string;
    'fetchTimeoutMs.hint': string;
    extractMode: string;
    'extractMode.inherit': string;
    'extractMode.auto': string;
    'extractMode.fast': string;
    'extractMode.rendered': string;
    extractFullPage: string;
    'extractFullPage.hint': string;
    extractUseLlmsTxt: string;
    'extractUseLlmsTxt.hint': string;
    'number.invalid': string;
    authUser: string;
    'authUser.placeholder': string;
    authPass: string;
    'authPass.placeholder': string;
    'authPass.show': string;
    'authPass.hide': string;
    'auth.hint': string;
    save: string;
    discard: string;
    reset: string;
    dirty: string;
    saving: string;
    readonly: string;
    loading: string;
    error: string;
};
