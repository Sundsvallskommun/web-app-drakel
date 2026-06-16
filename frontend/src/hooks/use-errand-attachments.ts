'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { getErrandAttachments } from '@services/errand-service/errand-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandAttachmentsResult {
  attachments: Attachment[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads the attachments for an errand. Fetched separately from the errand itself. */
export const useErrandAttachments = (errandId: string): UseErrandAttachmentsResult => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getErrandAttachments(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setAttachments([]);
      } else {
        setError(undefined);
        setAttachments(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { attachments, isLoading, error, refresh: load };
};
