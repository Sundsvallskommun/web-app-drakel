'use client';

import { NormberakningTypes } from '@data-contracts/backend/data-contracts';
import { getNormberakningTypes, NormberakningDraft } from '@services/normberakning-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

const NO_TYPES: NormberakningTypes = { incomeTypes: [], costTypes: [], livingCostTypes: [] };

/**
 * The income/cost types the add-row dropdowns offer for the errand. They follow where the beräkning is —
 * careM's catalogues, then Lifecare's once it is saved there — so they are read again when `source` changes.
 */
export const useNormberakningTypes = (errandId: string, source: NormberakningDraft['source']): NormberakningTypes => {
  const fetchTypes = useCallback(
    () => getNormberakningTypes(errandId),
    // `source` is not read by the fetch, but a new source means a new catalogue.
    [errandId, source]
  );
  return useServiceQuery(fetchTypes, { initialData: NO_TYPES, ready: !!errandId && !!source }).data;
};
