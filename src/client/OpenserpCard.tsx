/**
 * The `web-search-openserp` card on the settings "plugin configuration" page.
 *
 * The upstream client face exports no reusable card component, so the chrome is
 * self-drawn the way `dsh-llm-fallbacks` draws it: a collapsible `<li>` whose
 * header stacks the plugin name over its description and carries an "unsaved"
 * pill, then the form, then Discard / Reset / Save.
 *
 * Unlike the sibling search cards this one edits every field the schema
 * carries, because this plugin owns TWO capabilities over ONE instance: the
 * search knobs and the fetch knobs are the same deployment's configuration, and
 * a card that hid half of them would send the user to the settings document for
 * the other half. The split into two groups is therefore about what each
 * setting acts on, not about who owns it.
 *
 * @module dsh-web-search-openserp/client/OpenserpCard
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Input, Pill } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  ENGINE_CHOICES,
  EXTRACT_MODE_CHOICES,
  isDirty,
  isSavable,
  isValidBaseURL,
  isValidCount,
} from './openserp-store.js'
import type {
  ExtractMode,
  OpenserpCardState,
  OpenserpSettingsController,
  ToggleField,
} from './openserp-store.js'

/** Injected face the slot registration hands this card. */
export interface OpenserpCardInjected {
  controller: OpenserpSettingsController
  /**
   * Selector hook over the card's store. The registration hands the store to
   * the renderer as `hooks.openserpCard`; the renderer binds it and delivers it
   * here under the capitalized `use` name.
   */
  useOpenserpCard: <T>(select: (snapshot: OpenserpCardState) => T) => T
}

/** Props delivered by the slot outlet: the inject face plus the locale seat. */
export type OpenserpCardProps = OpenserpCardInjected & {
  t: (key: string, params?: Record<string, string>) => string
}

/**
 * Render the OpenSERP settings card.
 * @param props - injected controller/hook and the synthesized `t` seat.
 * @returns the card element.
 */
export function OpenserpCard({ controller, useOpenserpCard, t }: OpenserpCardProps): ReactNode {
  const state = useOpenserpCard((snapshot) => snapshot)
  const [open, setOpen] = useState(false)
  // Whether the password field shows its value in the clear. Deliberately
  // component state rather than a draft field: revealing a secret is a viewing
  // preference, so it must never reach the settings document.
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    void controller.load()
  }, [controller])

  const dirty = isDirty(state)
  const urlOk = isValidBaseURL(state.draft.baseURL)
  const busy = state.saving
  const readonly = !state.writable
  const disabled = busy || readonly
  const canSave = dirty && !busy && !readonly && isSavable(state)

  /** One checkbox row: control, label, and the explanation under both. */
  const toggle = (field: ToggleField, label: string, hint?: string): ReactNode => (
    <label className="dsw-openserp-card__toggle" key={field}>
      <input
        type="checkbox"
        checked={state.draft[field]}
        disabled={disabled}
        onChange={(event) => controller.toggle(field, event.target.checked)}
      />
      <span>{label}</span>
      {hint === undefined ? null : <small>{hint}</small>}
    </label>
  )

  /** One millisecond/character bound, with its own validity notice. */
  const count = (
    field: 'timeoutMs' | 'maxSnippetChars' | 'fetchTimeoutMs',
    label: string,
    hint: string,
  ): ReactNode => (
    <label className="dsw-openserp-card__field" key={field}>
      <span>{label}</span>
      <Input
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        value={state.draft[field]}
        disabled={disabled}
        onChange={(event) => controller.edit(field, event.target.value)}
      />
      <small>{hint}</small>
      {isValidCount(state.draft[field]) ? null : (
        <small role="alert">{t('number.invalid')}</small>
      )}
    </label>
  )

  return (
    <li className="dsw-openserp-card">
      <button
        type="button"
        className="dsw-openserp-card__header"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="dsw-openserp-card__heading">
          <span className="dsw-openserp-card__title">{t('title')}</span>
          <span className="dsw-openserp-card__description">{t('description')}</span>
        </span>
        {dirty ? <Pill>{t('dirty')}</Pill> : null}
        {/* Disclosure indicator. Drawn inline rather than imported: the icon
            components the built-in cards use are private to their own bundles,
            so a third-party card cannot reach them. The glyph is decorative —
            `aria-expanded` on the button already carries the state — hence
            `aria-hidden`, and the rotation lives in CSS. */}
        <svg
          className={`dsw-openserp-card__chevron${
            open ? ' dsw-openserp-card__chevron--open' : ''
          }`}
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="dsw-openserp-card__body">
          {state.status === 'loading' ? <p>{t('loading')}</p> : null}
          {state.status === 'failed' ? (
            <p role="alert">{t('error', { message: state.error ?? '' })}</p>
          ) : null}
          {readonly && state.status === 'ready' ? <p>{t('readonly')}</p> : null}

          <label className="dsw-openserp-card__field">
            <span>{t('baseURL')}</span>
            <Input
              type="url"
              inputMode="url"
              spellCheck={false}
              value={state.draft.baseURL}
              placeholder={t('baseURL.placeholder')}
              disabled={disabled}
              onChange={(event) => controller.edit('baseURL', event.target.value)}
            />
            {/* An empty field is not necessarily unconfigured: the environment
                may be supplying the URL, and saying "unset" there would lie. */}
            {state.draft.baseURL.trim() === '' && state.baseURLSource === 'environment' ? (
              <small>
                {t('baseURL.fromEnvironment', {
                  env: state.baseURLEnvVar,
                  url: state.effectiveBaseURL ?? '',
                })}
              </small>
            ) : null}
            {state.draft.baseURL.trim() === '' && state.baseURLSource === 'none' ? (
              <small role="alert">{t('baseURL.unset', { env: state.baseURLEnvVar })}</small>
            ) : null}
            {!urlOk ? <small role="alert">{t('baseURL.invalid')}</small> : null}
          </label>

          <fieldset className="dsw-openserp-card__field dsw-openserp-card__group">
            <legend>{t('search')}</legend>
            <small>{t('search.hint')}</small>

            <div className="dsw-openserp-card__field dsw-openserp-card__engines">
              <span>{t('engines')}</span>
              <small>{t('engines.hint')}</small>
              {/* Multi-select: one engine hits its dedicated route, several hit
                  mega/search, which merges and deduplicates. Leaving every box
                  unchecked defers to the instance's own default engine set. */}
              {ENGINE_CHOICES.map((choice) => {
                const checked = state.draft.engines.includes(choice.value)
                return (
                  <label key={choice.value} className="dsw-openserp-card__engine">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => controller.toggleEngine(choice.value)}
                    />
                    <span>{choice.label}</span>
                  </label>
                )
              })}
            </div>

            <div className="dsw-openserp-card__numbers">
              {count('timeoutMs', t('timeoutMs'), t('timeoutMs.hint'))}
              {count('maxSnippetChars', t('maxSnippetChars'), t('maxSnippetChars.hint'))}
            </div>

            {toggle('extract', t('extract'), t('extract.hint'))}
          </fieldset>

          <fieldset className="dsw-openserp-card__field dsw-openserp-card__group">
            <legend>{t('fetch')}</legend>
            <small>{t('fetch.hint')}</small>

            {count('fetchTimeoutMs', t('fetchTimeoutMs'), t('fetchTimeoutMs.hint'))}

            <label className="dsw-openserp-card__field">
              <span>{t('extractMode')}</span>
              {/* A closed list: the mode is a union in the schema, so free text
                  could only ever be a refusal at save time. */}
              <select
                value={state.draft.extractMode}
                disabled={disabled}
                onChange={(event) =>
                  controller.editExtractMode(event.target.value as '' | ExtractMode)
                }
              >
                {EXTRACT_MODE_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {t(choice.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            {toggle('extractFullPage', t('extractFullPage'), t('extractFullPage.hint'))}
            {toggle('extractUseLlmsTxt', t('extractUseLlmsTxt'), t('extractUseLlmsTxt.hint'))}
          </fieldset>

          <label className="dsw-openserp-card__field">
            <span>{t('authUser')}</span>
            <Input
              type="text"
              inputMode="text"
              autoComplete="username"
              spellCheck={false}
              value={state.draft.authUser}
              placeholder={t('authUser.placeholder')}
              disabled={disabled}
              onChange={(event) => controller.edit('authUser', event.target.value)}
            />
          </label>

          <label className="dsw-openserp-card__field">
            <span>{t('authPass')}</span>
            <span className="dsw-openserp-card__secret">
              <Input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                spellCheck={false}
                value={state.draft.authPass}
                placeholder={t('authPass.placeholder')}
                disabled={disabled}
                onChange={(event) => controller.edit('authPass', event.target.value)}
              />
              {/* The toggle sits inside the label, so a click would otherwise
                  also activate the labelled control; preventDefault keeps the
                  reveal from pulling focus into the field. */}
              <button
                type="button"
                className="dsw-openserp-card__reveal"
                aria-label={t(showPass ? 'authPass.hide' : 'authPass.show')}
                aria-pressed={showPass}
                disabled={disabled}
                onClick={(event) => {
                  event.preventDefault()
                  setShowPass((value) => !value)
                }}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M8 3.2C4.6 3.2 1.9 5.6 1.2 8c.7 2.4 3.4 4.8 6.8 4.8s6.1-2.4 6.8-4.8c-.7-2.4-3.4-4.8-6.8-4.8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <circle cx="8" cy="8" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.3" />
                  {showPass ? null : (
                    <path d="M3 13 13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            </span>
            <small>{t('auth.hint')}</small>
          </label>

          <div className="dsw-openserp-card__footer">
            <Button
              variant="ghost"
              size="sm"
              disabled={!dirty || busy}
              onClick={() => controller.discard()}
            >
              {t('discard')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => void controller.reset()}
            >
              {t('reset')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!canSave}
              onClick={() => void controller.save()}
            >
              {busy ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  )
}
