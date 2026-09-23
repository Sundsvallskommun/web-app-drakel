'use client';

import { getLifecareRecords, LifecareRecords } from '@services/lifecare-documents-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseLifecareDocumentsResult {
  records: LifecareRecords;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_RECORDS: LifecareRecords = { journalNotes: [], documents: [] };

/**
 * Loads the applicant's Lifecare record for an errand — journalanteckningar and documents read live
 * from Lifecare.
 */
export const useLifecareDocuments = (errandId: string): UseLifecareDocumentsResult => {
  const fetchRecords = useCallback(() => getLifecareRecords(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchRecords, { initialData: NO_RECORDS, ready: !!errandId });
  return { records: data, ...query };
};
