'use client';

import { Document, DocumentType, getDocuments, getDocumentTypes } from '@services/document-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandDocumentsResult {
  documents: Document[];
  types: DocumentType[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_DOCUMENTS: Document[] = [];
const NO_TYPES: DocumentType[] = [];

/** Loads an errand's dokument and the selectable document types. */
export const useErrandDocuments = (errandId: string): UseErrandDocumentsResult => {
  const fetchDocuments = useCallback(() => getDocuments(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchDocuments, { initialData: NO_DOCUMENTS, ready: !!errandId });
  // The type list is a best-effort lookup: failing to load it just leaves the type picker empty.
  const { data: types } = useServiceQuery(getDocumentTypes, { initialData: NO_TYPES });
  return { documents: data, types, ...query };
};
