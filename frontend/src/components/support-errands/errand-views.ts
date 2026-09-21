/**
 * The status "views" in the overview sidebar: Pågående (everything not closed) and Avslutade (CLOSED).
 *
 * Pågående is expressed as a negation rather than a list of open statuses, so a status added to the
 * catalogue later still shows up instead of silently falling out of the view.
 */
export type ErrandView = 'ongoing' | 'closed';

/** The views in sidebar order; each view's label is the translation key `overview:views.<view>`. */
export const ERRAND_VIEWS: ErrandView[] = ['ongoing', 'closed'];

/** The single status that counts as avslutad; everything else is pågående. */
export const CLOSED_ERRAND_STATUS = 'CLOSED';
