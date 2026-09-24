'use client';

import { PreviousCalculationView } from '@data-contracts/backend/data-contracts';
import { ServiceError, useServiceQuery } from '@hooks/use-service-query';
import { getPreviousNormberakning } from '@services/normberakning-service';
import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface PreviousNormberakningContextValue {
  /** Whether the handläggare has ticked "Visa föregående normberäkning". */
  isShown: boolean;
  setShown: (shown: boolean) => void;
  /** The preceding Lifecare calculation, or null when the applicant has none. */
  calculation: PreviousCalculationView | null;
  isLoading: boolean;
  error?: ServiceError;
}

const PreviousNormberakningContext = createContext<PreviousNormberakningContextValue | undefined>(undefined);

const NO_CALCULATION: PreviousCalculationView | null = null;

/**
 * Holds the "Visa föregående normberäkning" toggle and the calculation it reveals, so that every
 * normberäkning sub-tab can render its own slice of one shared fetch instead of loading its own copy.
 *
 * The fetch is lazy: nothing is requested until the checkbox is ticked. Everything the context exposes
 * is read-only — the previous calculation lives in Lifecare and Draken has no way to edit it.
 */
export const PreviousNormberakningProvider: FC<{ errandId: string; children: ReactNode }> = ({
  errandId,
  children,
}) => {
  const [isShown, setShown] = useState<boolean>(false);
  const fetchPrevious = useCallback(() => getPreviousNormberakning(errandId), [errandId]);
  const { data, isLoading, error } = useServiceQuery<PreviousCalculationView | null>(fetchPrevious, {
    initialData: NO_CALCULATION,
    ready: !!errandId,
    enabled: isShown,
  });

  const value = useMemo(
    () => ({ isShown, setShown, calculation: data, isLoading, error }),
    [isShown, data, isLoading, error]
  );

  return <PreviousNormberakningContext.Provider value={value}>{children}</PreviousNormberakningContext.Provider>;
};

/** Reads the shared previous-normberäkning state. Throws outside the provider, which would be a wiring bug. */
export const usePreviousNormberakning = (): PreviousNormberakningContextValue => {
  const context = useContext(PreviousNormberakningContext);
  if (!context) {
    throw new Error('usePreviousNormberakning must be used inside a PreviousNormberakningProvider');
  }
  return context;
};
