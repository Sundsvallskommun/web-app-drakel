import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

/** An EB income warning on an errand that the handläggare can acknowledge or close. */
export class Warning {
  @IsString()
  @IsOptional()
  id?: string;
  /** The warning type as a machine code; `typeDisplayName` carries the label to show. */
  @IsString()
  @IsOptional()
  type?: string;
  /** caremanagement's own Swedish label for the type — the frontend shows this rather than translating. */
  @IsString()
  @IsOptional()
  typeDisplayName?: string;
  /** The Draken tab the warning belongs to: CALCULATION / DECISION / PAYMENT. */
  @IsString()
  @IsOptional()
  section?: string;
  /** A stable key for the income the warning concerns (förmån/inkomsttyp). */
  @IsString()
  @IsOptional()
  sourceKey?: string;
  /** Human-readable warning text. */
  @IsString()
  @IsOptional()
  message?: string;
  /** Warning status as a machine code: OPEN / ACKNOWLEDGED / CLOSED. */
  @IsString()
  @IsOptional()
  status?: string;
  /** caremanagement's own Swedish label for the status. */
  @IsString()
  @IsOptional()
  statusDisplayName?: string;
  /** Whether the warning was closed automatically (its cause resolved) rather than by a handläggare. */
  @IsBoolean()
  @IsOptional()
  autoResolved?: boolean;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  updated?: string;
}

export class WarningsApiResponse implements ApiResponse<Warning[]> {
  @ValidateNested({ each: true })
  @Type(() => Warning)
  data!: Warning[];
  @IsString()
  message!: string;
}
