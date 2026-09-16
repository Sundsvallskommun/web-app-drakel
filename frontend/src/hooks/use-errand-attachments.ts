'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { getErrandAttachments } from '@services/errand-service/errand-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandAttachmentsResult {
  attachments: Attachment[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_ATTACHMENTS: Attachment[] = [];

/** Loads the attachments for an errand. Fetched separately from the errand itself. */
export const useErrandAttachments = (errandId: string): UseErrandAttachmentsResult => {
  const fetchAttachments = useCallback(() => getErrandAttachments(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchAttachments, { initialData: NO_ATTACHMENTS, ready: !!errandId });
  return { attachments: data, ...query };
};
