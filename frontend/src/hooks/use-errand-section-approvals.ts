'use client';

import {
  getSectionApprovals,
  SectionApprovals,
  SectionKey,
  setSectionApproval,
} from '@services/section-approval-service';
import { useCallback, useState } from 'react';

import { useServiceQuery } from './use-service-query';

interface UseErrandSectionApprovalsResult {
  approvals: SectionApprovals;
  isLoading: boolean;
  /** The section whose approval is currently being saved, if any. */
  pendingSection?: SectionKey;
  setApproval: (section: SectionKey, approved: boolean) => Promise<boolean>;
  refresh: () => void;
}

const NO_APPROVALS: SectionApprovals = {};

/**
 * Loads and mutates the approval state of an errand's three EB sections. Instantiated once at the
 * errand-detail level so the per-section checkboxes and the "Besluta och utbetala" action share one source.
 */
export const useErrandSectionApprovals = (errandId: string, enabled = true): UseErrandSectionApprovalsResult => {
  const [pendingSection, setPendingSection] = useState<SectionKey>();
  const fetchApprovals = useCallback(() => getSectionApprovals(errandId), [errandId]);
  const { data, isLoading, refresh } = useServiceQuery(fetchApprovals, {
    initialData: NO_APPROVALS,
    enabled: enabled && !!errandId,
  });

  const setApproval = useCallback(
    async (section: SectionKey, approved: boolean): Promise<boolean> => {
      setPendingSection(section);
      const res = await setSectionApproval(errandId, section, approved);
      setPendingSection(undefined);
      if (!res.error) {
        refresh();
      }
      return !res.error;
    },
    [errandId, refresh]
  );

  return { approvals: data, isLoading, pendingSection, setApproval, refresh };
};
