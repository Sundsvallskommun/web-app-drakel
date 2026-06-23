'use client';

import {
  getSectionApprovals,
  SectionApprovals,
  SectionKey,
  setSectionApproval,
} from '@services/section-approval-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandSectionApprovalsResult {
  approvals: SectionApprovals;
  isLoading: boolean;
  /** The section whose approval is currently being saved, if any. */
  pendingSection?: SectionKey;
  setApproval: (section: SectionKey, approved: boolean) => Promise<boolean>;
  refresh: () => void;
}

/**
 * Loads and mutates the approval state of an errand's three EB sections. Instantiated once at the
 * errand-detail level so the per-section checkboxes and the sidebar Avsluta button share one source.
 */
export const useErrandSectionApprovals = (errandId: string, enabled = true): UseErrandSectionApprovalsResult => {
  const [approvals, setApprovals] = useState<SectionApprovals>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingSection, setPendingSection] = useState<SectionKey>();

  const load = useCallback(() => {
    if (!errandId || !enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void getSectionApprovals(errandId).then((res) => {
      setApprovals(res.data ?? {});
      setIsLoading(false);
    });
  }, [errandId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const setApproval = useCallback(
    async (section: SectionKey, approved: boolean): Promise<boolean> => {
      setPendingSection(section);
      const res = await setSectionApproval(errandId, section, approved);
      setPendingSection(undefined);
      if (!res.error) {
        load();
      }
      return !res.error;
    },
    [errandId, load]
  );

  return { approvals, isLoading, pendingSection, setApproval, refresh: load };
};
