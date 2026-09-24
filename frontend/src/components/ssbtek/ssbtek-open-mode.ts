'use client';

/**
 * Where "Hämta från SSBTEK" opens: the SSBTEK page in a new tab, so the errand stays open beside it, or the panel
 * at the foot of the errand itself.
 */
type SsbtekOpenMode = 'NEW_TAB' | 'SAME_ERRAND';

/**
 * The handläggare's choice of where SSBTEK opens. A new tab for now.
 *
 * TODO(ssbtek-preference): read the handläggare's preference from careM's coming preference endpoint.
 */
export const useSsbtekOpenMode = (): SsbtekOpenMode => 'NEW_TAB';
