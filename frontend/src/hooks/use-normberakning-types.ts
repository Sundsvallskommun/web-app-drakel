'use client';

import { getNormberakningTypes, NormberakningTypes } from '@services/normberakning-service';

import { useServiceQuery } from './use-service-query';

const NO_TYPES: NormberakningTypes = { incomeTypes: [], costTypes: [], livingCostTypes: [] };

/** Loads the (global) labelled income/cost type catalogues for the add-row dropdowns. */
export const useNormberakningTypes = (): NormberakningTypes =>
  useServiceQuery(getNormberakningTypes, { initialData: NO_TYPES }).data;
