'use client';

import { Administrator, getAdministrators } from '@services/administrator-service';
import { useEffect, useState } from 'react';

/** Loads the handläggare roster (AD users) for the assignee picker and the overview filter. */
export const useAdministrators = (): { administrators: Administrator[]; isLoading: boolean } => {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    void getAdministrators().then((res) => {
      if (!active) {
        return;
      }
      setAdministrators(res.error ? [] : (res.data ?? []));
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { administrators, isLoading };
};
