'use client';

import { createContext, useContext } from 'react';

/** A party (sökande/medsökande) surfaced in the slim header next to the errand number. */
export interface HeaderParty {
  role?: string;
  name: string;
  personalNumber?: string;
}

export interface HeaderErrand {
  id?: string;
  errandNumber?: string;
  title?: string;
  status?: string;
  /** Sökande and medsökande shown at the top of the errand, next to the errand number. */
  parties?: HeaderParty[];
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
