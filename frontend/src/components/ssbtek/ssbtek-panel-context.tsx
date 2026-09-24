'use client';

import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface SsbtekPanelContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SsbtekPanelContext = createContext<SsbtekPanelContextValue | undefined>(undefined);

/** Whether the SSBTEK panel at the foot of the page is open — shared by the header button and the panel. */
export const SsbtekPanelProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const toggle = useCallback(() => {
    setOpen((open) => !open);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  const value = useMemo(() => ({ isOpen, toggle, close }), [isOpen, toggle, close]);
  return <SsbtekPanelContext.Provider value={value}>{children}</SsbtekPanelContext.Provider>;
};

/** The SSBTEK panel's state. Throws outside the provider, which would be a wiring bug. */
export const useSsbtekPanel = (): SsbtekPanelContextValue => {
  const context = useContext(SsbtekPanelContext);
  if (!context) {
    throw new Error('useSsbtekPanel must be used inside an SsbtekPanelProvider');
  }
  return context;
};
