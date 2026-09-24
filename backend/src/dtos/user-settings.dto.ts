import { IsBoolean } from 'class-validator';

/** The handläggare's settings, as they save them — every setting, since careM replaces them whole. */
export class UpdateUserSettingsDto {
  /** Whether "Hämta från SSBTEK" opens the SSBTEK page in a new tab rather than on the errand. */
  @IsBoolean()
  ssbtekOpenInNewWindow!: boolean;
}
