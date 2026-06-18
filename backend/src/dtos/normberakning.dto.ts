import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Fields accepted when adding (POST) or editing (PATCH) a draft normberäkning row. The union of the
 * three sections' inputs — caremanagement validates the section-specific shape. Handläggare only ever
 * set their own value/note; the process values are system-owned and read-only.
 */
export class NormRowInputDto {
  // Income
  @IsInt() @IsOptional() typeId?: number;
  @IsString() @IsOptional() typeName?: string;
  @IsString() @IsOptional() recipient?: string;
  @IsNumber() @IsOptional() handlaggareAmount?: number;
  @IsString() @IsOptional() handlaggareAmountDate?: string;
  // Expense
  @IsString() @IsOptional() costType?: string;
  @IsString() @IsOptional() otherSubType?: string;
  @IsString() @IsOptional() specification?: string;
  // Person
  @IsString() @IsOptional() partyId?: string;
  @IsString() @IsOptional() role?: string;
  @IsString() @IsOptional() name?: string;
  @IsInt() @IsOptional() handlaggareDays?: number;
  // Shared
  @IsString() @IsOptional() note?: string;
}
