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
export {};
