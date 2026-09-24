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
/**
 * Which face an outlet is asking for.
 *
 * 0.1.7's plugin page mounts one registration once per face: `summary` supplies the row's and
 * the detail page's one-liner, `page` supplies the configuration body. Absent means the outlet
 * is the older keyed slot, which has no such notion.
 */
export type OpenserpCardView = 'summary' | 'page';
/** Props delivered by the slot outlet: the inject face plus the locale seat. */
export type OpenserpCardProps = OpenserpCardInjected & {
    t: (key: string, params?: Record<string, string>) => string;
    /** Set by an outlet that renders this card once per face. */
    view?: OpenserpCardView;
    /** Set by an outlet whose page already draws the row chrome: icon, title, enable switch. */
    embedded?: boolean;
};
/**
 * Render the OpenSERP settings card.
 * @param props - injected controller/hook and the synthesized `t` seat.
 * @returns the card element.
 */
export declare function OpenserpCard({ controller, useOpenserpCard, t, view, embedded, }: OpenserpCardProps): ReactNode;
