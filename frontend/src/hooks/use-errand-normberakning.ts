'use client';

import { getNormberakningDraft, NormberakningDraft } from '@services/normberakning-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandNormberakningResult {
  draft?: NormberakningDraft;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_DRAFT: NormberakningDraft | undefined = undefined;

/**
 * Loads the draft normberäkning (income rows) for an errand. A 404 means no draft exists yet for the errand,
 * which is a normal state rather than an error.
 */
export const useErrandNormberakning = (errandId: string): UseErrandNormberakningResult => {
  const fetchDraft = useCallback(() => getNormberakningDraft(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<NormberakningDraft | undefined>(fetchDraft, {
    initialData: NO_DRAFT,
    ready: !!errandId,
    notFoundAsEmpty: true,
  });
  return { draft: data, ...query };
};
