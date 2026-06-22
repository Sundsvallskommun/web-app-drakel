'use client';

import { getNormberakningTypes, NormberakningTypes } from '@services/normberakning-service';
import { useEffect, useState } from 'react';

const EMPTY: NormberakningTypes = { incomeTypes: [], costTypes: [], livingCostTypes: [] };

/** Loads the (global) labelled income/cost type catalogues for the add-row dropdowns. */
export const useNormberakningTypes = (): NormberakningTypes => {
  const [types, setTypes] = useState<NormberakningTypes>(EMPTY);

  useEffect(() => {
    void getNormberakningTypes().then((res) => {
      if (res.data) {
        setTypes(res.data);
      }
    });
  }, []);

  return types;
};
