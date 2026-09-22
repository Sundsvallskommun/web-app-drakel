import { PermissionsResponse, User, UserRoleEnum } from '@data-contracts/backend/data-contracts';

const defaultPermissions: PermissionsResponse = {
  canEditErrands: false,
  canManageTemplates: false,
  canViewEventLog: false,
};

export const emptyUser: User = {
  name: '',
  username: '',
  role: UserRoleEnum.AppRead,
  permissions: defaultPermissions,
};
