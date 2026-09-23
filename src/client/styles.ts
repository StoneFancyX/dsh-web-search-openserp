/**
 * Card styles, injected as one plugin-owned `<style>` tag.
 *
 * The upstream cards use CSS Modules compiled into their bundle. This plugin
 * ships one small stylesheet instead: the rule set is a couple of dozen
 * selectors, and a CSS-Modules pipeline would add a bundler plugin (hashing,
 * virtual ids, the `_<hash>_<local>` identifier contract) to own nothing but
 * that. The class names are prefixed instead, which is what the hashing would
 * buy here.
 *
 * Every colour, radius and border comes from the shell's `--dsw-alias-*` tokens
 * rather than literals, so the card follows the light/dark theme and any
 * future retheme without this package shipping an update.
 *
 * @module dsh-web-search-openserp/client/styles
 */

/** Attribute the shell uses to reap plugin-owned tags when a bundle unloads. */
export const STYLE_TAG_ATTRIBUTE = 'data-plugin'

/** Identifier carried on the tag; matches the package name. */
export const STYLE_TAG_ID = 'dsh-web-search-openserp'

/** The card's stylesheet, mirroring the sibling plugin cards' chrome. */
export const CARD_CSS = `
.dsw-openserp-card {
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3);
  transition: border-color 0.16s, background 0.16s;
}
.dsw-openserp-card:hover { border-color: var(--dsw-alias-label-dimmed); }

.dsw-openserp-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.dsw-openserp-card__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}
.dsw-openserp-card__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 21px;
  color: var(--dsw-alias-label-primary);
}
.dsw-openserp-card__description {
  font-size: 13px;
  line-height: 19px;
  color: var(--dsw-alias-label-tertiary);
}

/* Disclosure indicator. The card toggles the --open modifier from its own
   state rather than keying off [aria-expanded], so the rotation has exactly
   one source of truth. 14px matches the built-in cards' chevron. */
.dsw-openserp-card__chevron {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  transition: transform 0.15s ease;
}
.dsw-openserp-card__chevron--open {
  transform: rotate(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .dsw-openserp-card__chevron {
    transition: none;
  }
}

.dsw-openserp-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dsw-openserp-card__body > p {
  margin: 0;
  font-size: 13px;
  color: var(--dsw-alias-label-tertiary);
}

/* Both a fieldset (a group) and a label (a single control) wear this class, so
   the box chrome a user agent gives a fieldset is reset here: without it the
   group renders inside a default border that belongs to no design system. */
.dsw-openserp-card__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.dsw-openserp-card__field > span,
.dsw-openserp-card__field > legend {
  padding: 0;
  font-size: 13px;
  color: var(--dsw-alias-label-tertiary);
}
/* Password field with a reveal toggle. The wrapper has to out-specify the
   field > span label rule directly above, hence the child selector and the
   explicit resets; the button is absolutely positioned so the input keeps its
   full width while the glyph floats over its right edge. */
.dsw-openserp-card__field > .dsw-openserp-card__secret {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0;
  font-size: inherit;
  color: inherit;
}
.dsw-openserp-card__reveal {
  position: absolute;
  right: 4px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.dsw-openserp-card__reveal:hover:not(:disabled) {
  color: var(--dsw-alias-label-secondary);
}
.dsw-openserp-card__reveal:disabled {
  cursor: default;
  opacity: 0.5;
}
.dsw-openserp-card__reveal svg {
  width: 16px;
  height: 16px;
}
.dsw-openserp-card__field > small {
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary);
}
.dsw-openserp-card__field > select {
  padding: 7px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.dsw-openserp-card__field > select:disabled { cursor: default; opacity: 0.6; }

/* The two groups are what the settings are FOR, not what they are, so each
   gets a hairline rule and a little more air than the fields inside it. */
.dsw-openserp-card__group {
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dsw-openserp-card__group > legend {
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.dsw-openserp-card__numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.dsw-openserp-card__numbers > .dsw-openserp-card__field { flex: 1 1 180px; }

.dsw-openserp-card__engines { gap: 8px; }
.dsw-openserp-card__engine {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
}
.dsw-openserp-card__engine > input[type="checkbox"] {
  accent-color: var(--dsw-alias-accent, #4f8cff);
  cursor: pointer;
}
.dsw-openserp-card__engine:has(input:disabled) { opacity: 0.6; cursor: default; }

/* Same row shape as an engine checkbox, but the control comes first and the
   explanation hangs under the label text. */
.dsw-openserp-card__toggle {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
}
.dsw-openserp-card__toggle > input[type="checkbox"] {
  accent-color: var(--dsw-alias-accent, #4f8cff);
  cursor: pointer;
}
.dsw-openserp-card__toggle:has(input:disabled) { opacity: 0.6; cursor: default; }
.dsw-openserp-card__toggle > small {
  grid-column: 2;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary);
}

.dsw-openserp-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
`

/**
 * Attach the stylesheet, returning the disposer that removes it.
 *
 * Idempotent: a second call while a tag is already present reuses it, so an
 * HMR reload cannot stack duplicates.
 * @returns disposer removing the tag this call owns.
 */
export function installCardStyles(): () => void {
  const selector = `style[${STYLE_TAG_ATTRIBUTE}="${STYLE_TAG_ID}"]`
  const existing = document.head.querySelector(selector)
  if (existing !== null) return () => existing.remove()

  const tag = document.createElement('style')
  tag.setAttribute(STYLE_TAG_ATTRIBUTE, STYLE_TAG_ID)
  tag.textContent = CARD_CSS
  document.head.appendChild(tag)
  return () => tag.remove()
}
