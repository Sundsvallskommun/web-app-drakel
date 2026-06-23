'use client';

import { Document, DocumentType, getDocuments, getDocumentTypes } from '@services/document-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandDocumentsResult {
  documents: Document[];
  types: DocumentType[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads an errand's dokument and the selectable document types. */
export const useErrandDocuments = (errandId: string): UseErrandDocumentsResult => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getDocuments(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setDocuments([]);
      } else {
        setError(undefined);
        setDocuments(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void getDocumentTypes().then((res) => {
      if (!res.error) {
        setTypes(res.data ?? []);
      }
    });
  }, []);

  return { documents, types, isLoading, error, refresh: load };
};
