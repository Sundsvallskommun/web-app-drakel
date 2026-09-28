'use client';

import { useUserStore } from '@services/user-service/user-service';

interface ErrandEditPermission {
  /**
   * Whether the signed-in handläggare may change errands — the canEditErrands permission (the ADMIN_GROUP). False
   * until the user has loaded, so nothing is offered that the backend could refuse.
   */
  canEditErrands: boolean;
  /**
   * The signed-in handläggare is known to only read errands. The write actions are then left out, and this says
   * so, rather than leaving the missing actions unexplained. False while the user is still loading.
   */
  readOnly: boolean;
}

/** The signed-in handläggare's permission to change errands; the backend refuses errand writes without it (403). */
export const useErrandEditPermission = (): ErrandEditPermission => {
  const canEditErrands = useUserStore((state) => state.user.permissions.canEditErrands);
  // The empty user (before /me has answered) has no username.
  const userLoaded = useUserStore((state) => state.user.username !== '');
  return { canEditErrands, readOnly: userLoaded && !canEditErrands };
};
