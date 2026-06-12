import { User, UserRoleEnum } from '@data-contracts/backend/data-contracts';
import { ApiResponse } from '@services/api-service';

export const getMe: ApiResponse<User> = {
  data: {
    username: 'username',
    name: 'Förnamn Efternamn',
    role: UserRoleEnum.AppRead,
    permissions: {
      canEditErrands: false,
    },
  },
  message: 'success',
};
