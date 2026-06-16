'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { getLookups, LookupKind } from '@services/metadata-service/metadata-service';
import { useEffect, useState } from 'react';

/** Loads metadata lookups of a given kind (CATEGORY, TYPE, ROLE, CONTACT_REASON, STATUS). */
export const useLookups = (kind: LookupKind): { lookups: Lookup[]; isLoading: boolean } => {
  const [lookups, setLookups] = useState<Lookup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    void getLookups(kind).then((res) => {
      if (!active) {
        return;
      }
      setLookups(res.error ? [] : (res.data ?? []));
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [kind]);

  return { lookups, isLoading };
};
