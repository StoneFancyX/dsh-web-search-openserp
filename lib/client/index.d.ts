export { OPENSERP_LOCALE_NS } from './locales.js';
export { ENGINE_CHOICES, EXTRACT_MODE_CHOICES, OpenserpSettingsController } from './openserp-store.js';
export type { ConfigWrite, ExtractMode, OpenserpCardState, OpenserpSettingsView, TextField, ToggleField, } from './openserp-store.js';
export { OpenserpCard } from './OpenserpCard.tsx';
export type { OpenserpCardInjected, OpenserpCardProps } from './OpenserpCard.tsx';
/**
 * Required client services. The card registration waits on the slot
 * declaration, so `slots` must be injected rather than read reflectively.
 */
export declare const inject: string[];
/**
 * Register the dictionaries and the card once the `settings.plugin.item`
 * declaration is on the ledger.
 * @param ctx - client root context.
 */
export declare function apply(ctx: any): void;
