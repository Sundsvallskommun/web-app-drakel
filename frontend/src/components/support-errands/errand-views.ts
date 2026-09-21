/**
 * The views in the overview sidebar.
 *
 * The three list views are the handläggare's own errands — "Mina ärenden" is always on there, so they
 * answer "what is on my desk". Looking beyond that is what `search` is for: it starts empty and fetches
 * only once the handläggare has said what to look for.
 */
export type ErrandView = 'all' | 'ongoing' | 'closed' | 'search';

/**
 * The views in sidebar order; each view's label is the translation key `overview:views.<view>`. A
 * divider is drawn before `search`, which is the one view that is not a list of the handläggare's own
 * errands.
 */
export const ERRAND_VIEWS: ErrandView[] = ['ongoing', 'closed', 'all', 'search'];

/** The views that list the handläggare's own errands straight away. */
export const isOwnErrandsView = (view: ErrandView): boolean => view !== 'search';

/** The single status that counts as avslutad; everything else is pågående. */
export const CLOSED_ERRAND_STATUS = 'CLOSED';
