'use client';

import { useErrand } from './use-errand';

/**
 * The errand's own id, which the BFF's errand routes take, from what a URL names it by — its id or its errand
 * number (`EB-…`). Empty until the errand is read.
 */
export const useErrandApiId = (errandReference: string): string => useErrand(errandReference).errand?.id ?? '';
