/**
 * OpenSERP JSON wire shapes. Only the fields this provider reads are declared —
 * a real response carries more per result (`favicon`, `domain`, `position`,
 * `classification`, …) and the set varies by engine, so every field here is
 * optional except `url`, which is the one thing a citeable source cannot do
 * without.
 *
 * OpenSERP differs from SearXNG in three ways that shape this module:
 *   - results carry an explicit `rank` (organic-only when ads are dropped);
 *   - failures are reported once, in `meta.engines_failed`, rather than per
 *     result;
 *   - `extract=1` inlines the target page's正文 under `extracted`.
 *
 * @module dsh-web-search-openserp/types
 */
/**
 * A page's extracted body, present only when the request asked for
 * `extract=1`. `content` is the field worth reading; `format` says how to read
 * it (currently always `markdown`).
 */
export interface OpenserpExtracted {
    /** Extracted body, in the format named by `format`. */
    readonly content?: unknown;
    /** How `content` is encoded — `markdown` in practice. */
    readonly format?: unknown;
    /** Page title as the extractor saw it (may differ from the SERP title). */
    readonly title?: unknown;
    /** Fetch mode used: `fast` | `rendered`. */
    readonly mode_used?: unknown;
}
/** One entry of the response's `results[]` array. */
export interface OpenserpResult {
    /** Result URL. The only field this provider requires. */
    readonly url?: unknown;
    /** Result title as the engine reported it. */
    readonly title?: unknown;
    /** Engine-supplied excerpt. Becomes the source `snippet` when no正文 is present. */
    readonly snippet?: unknown;
    /** Organic rank within this result set. */
    readonly rank?: unknown;
    /** Which engine produced this row, e.g. `baidu`. */
    readonly engine?: unknown;
    /**
     * SERP block type. `ad` marks a sponsored row; `answer_box` and
     * `related_searches` are non-result modules a caller usually filters out.
     * Omitted (`undefined`) for organic rows.
     */
    readonly type?: unknown;
    /** Sponsored flag. Redundant with `type === 'ad'` but cheaper to test. */
    readonly ad?: unknown;
    /** Publication timestamp, when the engine dates its results. */
    readonly published_at?: unknown;
    /** Page body, present only when `extract=1` was requested. */
    readonly extracted?: OpenserpExtracted | null;
}
/** Partial-failure and timing report for one response. */
export interface OpenserpMeta {
    /** Engines that answered. */
    readonly engines_responded?: unknown;
    /** Engines that were requested but failed. */
    readonly engines_failed?: unknown;
    /** Wall-clock duration of the search, in milliseconds. */
    readonly took_ms?: unknown;
}
/** The response body of any OpenSERP search endpoint. */
export interface OpenserpResponse {
    readonly meta?: OpenserpMeta;
    readonly query?: unknown;
    readonly results?: unknown;
}
/** Timing/mode report for one `/extract` response. */
export interface OpenserpExtractMeta {
    /** Which path actually ran: `fast` | `rendered`. */
    readonly mode_used?: unknown;
    /** When the page was retrieved, ISO-8601. */
    readonly fetched_at?: unknown;
    /** Size of the fetched body in bytes, before any cap. */
    readonly bytes?: unknown;
    /** Wall-clock duration of the extraction, in milliseconds. */
    readonly took_ms?: unknown;
}
/**
 * The response body of `/extract`.
 *
 * There is deliberately no raw-HTML field: OpenSERP's contract is to hand back
 * a *readable* page, not the bytes it was served. `markdown` and `text` are two
 * renderings of the same cleaned body — the first keeps heading structure and
 * links, the second flattens to prose.
 */
export interface OpenserpExtractResponse {
    /** Final URL after redirects, when the instance reports one. */
    readonly url?: unknown;
    /** Page title as the extractor saw it. */
    readonly title?: unknown;
    /** Meta description, usually empty. */
    readonly description?: unknown;
    /** Cleaned body as markdown. Preferred over `text` for agents. */
    readonly markdown?: unknown;
    /** Cleaned body as plain text. */
    readonly text?: unknown;
    /** Detected document language, e.g. `en`. */
    readonly lang?: unknown;
    readonly meta?: OpenserpExtractMeta;
}
