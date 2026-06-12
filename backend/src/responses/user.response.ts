import ApiResponse from '@/interfaces/api-service.interface';
import { ClientUser, InternalRole, Permissions } from '@/interfaces/users.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsString, ValidateNested } from 'class-validator';

export class PermissionsResponse implements Permissions {
  @IsBoolean()
  canEditErrands: boolean;
}

export class User implements ClientUser {
  @IsString()
  name: string;
  @IsString()
  username: string;
  @IsIn(['app_read', 'app_admin'])
  role: InternalRole;
  @ValidateNested()
  @Type(() => PermissionsResponse)
  permissions: PermissionsResponse;
}

export class UserApiResponse implements ApiResponse<User> {
  @ValidateNested()
  @Type(() => User)
  data: User;
  @IsString()
  message: string;
}
