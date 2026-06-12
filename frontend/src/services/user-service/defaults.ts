import { PermissionsResponse, User, UserRoleEnum } from '@data-contracts/backend/data-contracts';
import { ApiResponse } from '@services/api-service';

export const defaultPermissions: PermissionsResponse = {
  canEditErrands: false,
};

export const emptyUser: User = {
  name: '',
  username: '',
  role: UserRoleEnum.AppRead,
  permissions: defaultPermissions,
};

export const emptyUserResponse: ApiResponse<User> = {
  data: emptyUser,
  message: 'none',
};
