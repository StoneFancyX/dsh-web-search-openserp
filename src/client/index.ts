/**
 * Browser half: registers the OpenSERP card on the plugins page.
 *
 * TWO slots, one card. Up to 0.1.5 the card went into the keyed
 * `settings.plugin.item` slot, whose owner dispatched one cell per settings
 * namespace and left the card to draw its own chrome. 0.1.7 replaced that with
 * its own plugins page, where a third-party bundle's configuration belongs on
 * the bundle's own row (`plugins.row.config`) — NOT in the page's Official
 * group, which `plugins.item` is reserved for. That page draws the row chrome —
 * icon, title, Configure control, detail shell — and mounts the card once per
 * `view`, so the card is asked to hand over a bare body rather than a second
 * disclosure header. All three registrations stand: `slots.inject` waits on the
 * declaration, so the slots a given harness does not declare never fire and each
 * line picks up exactly one.
 *
 * The card reads and writes through the plugin's OWN endpoints
 * (`connection.rpc` → `/api/web-search-openserp/*`). The generic settings API
 * cannot serve a third-party namespace — `exposedNamespaces()` is an explicit
 * allowlist — so this channel is the sanctioned route, not a workaround.
 *
 * Only value imports listed in the bundle's externals may appear in this
 * graph; every other `@deepseek-ai/*` import must be type-only. Violating that
 * does not degrade this card — it fails the whole Web UI's plugin load.
 *
 * @module dsh-web-search-openserp/client
 */
import { OPENSERP_LOCALE_NS, en, zh } from './locales.js'
import { OpenserpCard } from './OpenserpCard.tsx'
import { OpenserpSettingsController } from './openserp-store.js'
import { installCardStyles } from './styles.js'

export { OPENSERP_LOCALE_NS } from './locales.js'
export { ENGINE_CHOICES, EXTRACT_MODE_CHOICES, OpenserpSettingsController } from './openserp-store.js'
export type {
  ConfigWrite,
  ExtractMode,
  OpenserpCardState,
  OpenserpSettingsView,
  TextField,
  ToggleField,
} from './openserp-store.js'
export { OpenserpCard } from './OpenserpCard.tsx'
export type { OpenserpCardInjected, OpenserpCardProps } from './OpenserpCard.tsx'

/**
 * The cell this card occupies, in both slots.
 *
 * `settings.plugin.item` is a keyed slot: its owner enumerates the settings
 * namespaces the Host exposes and dispatches one key per namespace, so a card
 * is addressed by the namespace it edits — hence `key` below. `plugins.item` is
 * a list slot addressed by `id`. Both must equal `OPENSERP_SETTINGS_NAMESPACE`
 * in the host half.
 *
 * It is repeated as a literal rather than imported because that module pulls in
 * server-side packages that have no place in a browser bundle.
 */
const OPENSERP_SETTINGS_KEY = 'web-search-openserp'

/**
 * The row this bundle's configuration hangs off, as `<package name>#<row id>`.
 *
 * `plugins.row.config` is keyed that way. Both halves must match the package this
 * client half ships in and the row the bundle's `cordis.patch.yml` declares — a
 * mismatch registers nothing, and says nothing.
 */
const OPENSERP_ROW_CONFIG_KEY = 'dsh-web-search-openserp#web-search-openserp'

/**
 * Required client services. The card registration waits on the slot
 * declaration, so `slots` must be injected rather than read reflectively.
 */
export const inject = ['slots', 'locale', 'connection']

/**
 * Register the dictionaries and the card once a plugin-page slot declaration is
 * on the ledger.
 * @param ctx - client root context.
 */
export function apply(ctx: any): void {
  // The card's class names match nothing until this lands: without it the card
  // still renders, just with browser defaults, which reads as a broken UI
  // rather than a missing stylesheet.
  ctx.effect(() => installCardStyles(), 'web-search-openserp: card styles')

  ctx.effect(
    () => ctx.locale.register(OPENSERP_LOCALE_NS, { zh, en }),
    'web-search-openserp: dictionaries',
  )

  const connection = ctx.get('connection')
  const controller = new OpenserpSettingsController(connection.rpc)

  // 0.1.7's plugin page. A third-party plugin does NOT belong in the page's
  // Official group: `plugins.item` is documented as "for an official plugin".
  // `plugins.row.config` is the slot for a bundle's own row — it gives that row a
  // Configure control opening its own page. The key is
  // `<bundle package name>#<row id>`, and both halves must match what this
  // bundle's patch declares; a mismatch registers nothing, silently.
  //
  // `embedded` tells the card the page owns the chrome; `view` tells it which face
  // is being asked for: `summary` is the one-liner used when a package description
  // is absent, `page` is the form.
  ctx.slots.inject('plugins.row.config', () =>
    ctx.slots.register(
      {
        name: 'plugins.row.config',
        key: OPENSERP_ROW_CONFIG_KEY,
        locale: OPENSERP_LOCALE_NS,
        inject: () => ({
          controller,
          hooks: { openserpCard: controller.store },
          embedded: true,
        }),
      },
      OpenserpCard,
    ),
  )

  ctx.slots.inject('settings.plugin.item', function* () {
    // The `hooks` compartment is the sanctioned way to make a store reactive:
    // the renderer binds each entry to a selector hook and hands it over as
    // `use<Name>` — `openserpCard` arrives at the card as `useOpenserpCard`.
    // Binding it here instead would mean reaching for a React binder the shell
    // no longer publishes to plugins.
    yield ctx.slots.register(
      {
        name: 'settings.plugin.item',
        key: OPENSERP_SETTINGS_KEY,
        locale: OPENSERP_LOCALE_NS,
        inject: () => ({ controller, hooks: { openserpCard: controller.store } }),
      },
      OpenserpCard,
    )
  })
}
