import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** One income row of the draft normberäkning (FC income type + the applicant/co-applicant amounts). */
export class DraftIncomeRow {
  @IsInt()
  @IsOptional()
  typeId?: number;
  @IsString()
  @IsOptional()
  typeName?: string;
  @IsNumber()
  @IsOptional()
  applicantAmount?: number;
  @IsString()
  @IsOptional()
  applicantAmountDate?: string;
  @IsNumber()
  @IsOptional()
  coApplicantAmount?: number;
  @IsString()
  @IsOptional()
  coApplicantAmountDate?: string;
  @IsString()
  @IsOptional()
  note?: string;
}

/** The editable draft normberäkning — FC income rows, not yet created in Lifecare. */
export class NormberakningDraft {
  @IsString()
  @IsOptional()
  errandId?: string;
  @IsString()
  @IsOptional()
  applicationMonth?: string;
  @IsBoolean()
  @IsOptional()
  edited?: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftIncomeRow)
  @IsOptional()
  rows?: DraftIncomeRow[];
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  updated?: string;
}

export class NormberakningDraftApiResponse implements ApiResponse<NormberakningDraft> {
  @ValidateNested()
  @Type(() => NormberakningDraft)
  data!: NormberakningDraft;
  @IsString()
  message!: string;
}
