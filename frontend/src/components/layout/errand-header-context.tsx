'use client';

import { createContext, useContext } from 'react';

export interface HeaderErrand {
  id?: string;
  title?: string;
  status?: string;
}

interface ErrandHeaderContextValue {
  errand?: HeaderErrand;
  setErrand: (errand?: HeaderErrand) => void;
}

/**
 * Lets the errand page surface its current errand (status/title) into the slim app header, without
 * a global store. The provider lives in {@link AppShell}; the errand page sets it, the header reads it.
 */
export const ErrandHeaderContext = createContext<ErrandHeaderContextValue>({ setErrand: () => undefined });

export const useErrandHeader = () => useContext(ErrandHeaderContext);
