import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** One income row sent when editing the draft normberäkning. */
export class DraftIncomeRowDto {
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

/** Body for editing the draft normberäkning — the full set of income rows to persist. */
export class UpdateNormberakningDraftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftIncomeRowDto)
  rows!: DraftIncomeRowDto[];
}
