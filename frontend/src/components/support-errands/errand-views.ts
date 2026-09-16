/**
 * The status "views" in the overview sidebar — a small fixed set that replaces the per-status list:
 * Alla (no status filter), Nya (RECEIVED), Öppna (everything except RECEIVED and CLOSED) and Avslutade (CLOSED).
 */
export type ErrandView = 'all' | 'new' | 'open' | 'closed';

/** The views in sidebar order; each view's label is the translation key `overview:views.<view>`. */
export const ERRAND_VIEWS: ErrandView[] = ['all', 'new', 'open', 'closed'];

/** "Nya ärenden" filters on this status; "Avslutade ärenden" on CLOSED; "Öppna ärenden" is everything but these two. */
export const NEW_ERRAND_STATUS = 'RECEIVED';
export const CLOSED_ERRAND_STATUS = 'CLOSED';
