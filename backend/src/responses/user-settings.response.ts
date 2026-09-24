import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

/** The signed-in handläggare's own settings, kept in careM per AD account. */
export class UserSettingsView {
  /** Whether "Hämta från SSBTEK" opens the SSBTEK page in a new tab (true, careM's default) or on the errand. */
  @IsBoolean() ssbtekOpenInNewWindow!: boolean;
}

export class UserSettingsApiResponse implements ApiResponse<UserSettingsView> {
  @ValidateNested() @Type(() => UserSettingsView) data!: UserSettingsView;
  @IsString() message!: string;
}
