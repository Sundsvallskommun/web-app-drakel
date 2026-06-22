import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Fields accepted when adding (POST) or editing (PATCH) a draft normberäkning row — the union of the
 * three sections' inputs. caremanagement validates the section-specific shape. Handläggare only ever set
 * their own value/note; the process values are system-owned and read-only.
 */
export class NormRowInputDto {
  // Income (one row per type, applicant (S) + co-applicant (M) side)
  @IsInt() @IsOptional() typeId?: number;
  @IsString() @IsOptional() typeName?: string;
  @IsNumber() @IsOptional() applicantCaseworkerAmount?: number;
  @IsString() @IsOptional() applicantAmountDate?: string;
  @IsNumber() @IsOptional() coapplicantCaseworkerAmount?: number;
  @IsString() @IsOptional() coapplicantAmountDate?: string;
  // Expense (bucket = EXPENSE | SPECIAL_EXPENSE)
  @IsString() @IsOptional() costType?: string;
  @IsString() @IsOptional() bucket?: string;
  @IsString() @IsOptional() otherSubType?: string;
  @IsString() @IsOptional() specification?: string;
  @IsNumber() @IsOptional() caseworkerAmount?: number;
  // Person
  @IsString() @IsOptional() partyId?: string;
  @IsString() @IsOptional() role?: string;
  @IsString() @IsOptional() name?: string;
  @IsInt() @IsOptional() caseworkerDays?: number;
  @IsBoolean() @IsOptional() included?: boolean;
  @IsString() @IsOptional() deviationFromDate?: string;
  @IsString() @IsOptional() deviationToDate?: string;
  @IsString() @IsOptional() normInterval?: string;
  @IsNumber() @IsOptional() jobStimulusAmount?: number;
  // Shared
  @IsString() @IsOptional() note?: string;
}

/** Body for editing the draft normberäkning header (norm, calculation dates, household size). */
export class NormHeaderInputDto {
  @IsInt() @IsOptional() normId?: number;
  @IsString() @IsOptional() normType?: string;
  @IsString() @IsOptional() calculationFromDate?: string;
  @IsString() @IsOptional() calculationToDate?: string;
  @IsString() @IsOptional() calculationDate?: string;
  @IsBoolean() @IsOptional() hasCustomHouseholdSize?: boolean;
  @IsInt() @IsOptional() householdSize?: number;
}
