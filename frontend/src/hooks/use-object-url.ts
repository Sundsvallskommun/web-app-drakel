'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseObjectUrlResult {
  /** The object URL the component holds now; empty when it holds none. */
  objectUrl: string;
  /** Takes over a newly created object URL, revoking the one held before. */
  setObjectUrl: (url: string) => void;
  /** Revokes the object URL held, if any. */
  revokeObjectUrl: () => void;
}

/**
 * Holds one object URL at a time for a component that creates them on demand (a PDF opened on click): setting a
 * new one revokes the one before, and unmounting revokes the last, so the bytes behind them are never kept alive
 * after nothing can show them any more.
 */
export const useObjectUrl = (): UseObjectUrlResult => {
  const [objectUrl, setObjectUrlState] = useState<string>('');
  // The URL to revoke on unmount; state alone would be stale inside the cleanup.
  const heldUrlRef = useRef<string>('');

  const setObjectUrl = useCallback((url: string) => {
    if (heldUrlRef.current && heldUrlRef.current !== url) {
      window.URL.revokeObjectURL(heldUrlRef.current);
    }
    heldUrlRef.current = url;
    setObjectUrlState(url);
  }, []);

  const revokeObjectUrl = useCallback(() => {
    setObjectUrl('');
  }, [setObjectUrl]);

  useEffect(
    () => () => {
      if (heldUrlRef.current) {
        window.URL.revokeObjectURL(heldUrlRef.current);
        heldUrlRef.current = '';
      }
    },
    []
  );

  return { objectUrl, setObjectUrl, revokeObjectUrl };
};
