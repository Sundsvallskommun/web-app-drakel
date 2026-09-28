import { UserRoleEnum } from '@data-contracts/backend/data-contracts';
import { emptyUser } from '@services/user-service/defaults';
import { useUserStore } from '@services/user-service/user-service';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useErrandEditPermission } from './use-errand-edit-permission';

const signedIn = (canEditErrands: boolean) => {
  useUserStore.getState().setUser({
    name: 'Test Handläggare',
    username: 'abc01def',
    role: UserRoleEnum.AppRead,
    permissions: { canEditErrands, canManageTemplates: false, canViewEventLog: false },
  });
};

describe('useErrandEditPermission', () => {
  afterEach(() => {
    act(() => {
      useUserStore.getState().reset();
    });
  });

  it('lets a handläggare with canEditErrands change errands', () => {
    signedIn(true);

    const { result } = renderHook(() => useErrandEditPermission());

    expect(result.current).toEqual({ canEditErrands: true, readOnly: false });
  });

  it('makes a handläggare without canEditErrands read-only', () => {
    signedIn(false);

    const { result } = renderHook(() => useErrandEditPermission());

    expect(result.current).toEqual({ canEditErrands: false, readOnly: true });
  });

  it('offers no change while the user is still loading, without calling them read-only', () => {
    useUserStore.getState().setUser(emptyUser);

    const { result } = renderHook(() => useErrandEditPermission());

    expect(result.current).toEqual({ canEditErrands: false, readOnly: false });
  });
});
