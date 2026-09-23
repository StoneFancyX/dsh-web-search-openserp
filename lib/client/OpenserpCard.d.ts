import type { ReactNode } from 'react';
import type { OpenserpCardState, OpenserpSettingsController } from './openserp-store.js';
/** Injected face the slot registration hands this card. */
export interface OpenserpCardInjected {
    controller: OpenserpSettingsController;
    /**
     * Selector hook over the card's store. The registration hands the store to
     * the renderer as `hooks.openserpCard`; the renderer binds it and delivers it
     * here under the capitalized `use` name.
     */
    useOpenserpCard: <T>(select: (snapshot: OpenserpCardState) => T) => T;
}
/** Props delivered by the slot outlet: the inject face plus the locale seat. */
export type OpenserpCardProps = OpenserpCardInjected & {
    t: (key: string, params?: Record<string, string>) => string;
};
/**
 * Render the OpenSERP settings card.
 * @param props - injected controller/hook and the synthesized `t` seat.
 * @returns the card element.
 */
export declare function OpenserpCard({ controller, useOpenserpCard, t }: OpenserpCardProps): ReactNode;
