import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** The members of the household SSBTEK is read for: the errand's sökande and medsökande. */
const SSBTEK_PERSONS = ['APPLICANT', 'CO_APPLICANT'] as const;
export type SsbtekPerson = (typeof SSBTEK_PERSONS)[number];

/** One delförmån of a payment — a row of the payment's specification. */
export class SsbtekPaymentPart {
  /** The delförmån, e.g. "Arbetsmarknadspolitiskt program" or "Änkepension". */
  @IsOptional() @IsString() benefit?: string;
  /** What kind of amount it is (beloppstyp), e.g. "Ersättning enligt beslut". */
  @IsOptional() @IsString() amountType?: string;
  @IsOptional() @IsString() periodFrom?: string;
  @IsOptional() @IsString() periodTo?: string;
  /** The extent as a percentage, e.g. "100 %". */
  @IsOptional() @IsString() extent?: string;
  @IsOptional() @IsNumber() hours?: number;
  @IsOptional() @IsNumber() days?: number;
  @IsOptional() @IsNumber() netAmount?: number;
  @IsOptional() @IsNumber() grossAmount?: number;
  @IsOptional() @IsNumber() deductionAmount?: number;
  @IsOptional() @IsNumber() taxAmount?: number;
}

/** A payment an agency reports to the person, as SSBTEK answered it. */
export class SsbtekPayment {
  /** Whom it was paid to: the sökande or the medsökande. */
  @IsIn(SSBTEK_PERSONS) person!: SsbtekPerson;
  /** The agency that paid: FK (Försäkringskassan), PM (Pensionsmyndigheten) or AKASSA (the a-kassa). */
  @IsString() source!: string;
  /** The förmån, e.g. "Bostadsbidrag". */
  @IsString() benefit!: string;
  /** Betalningsdag, `yyyy-MM-dd`. */
  @IsOptional() @IsString() paidOn?: string;
  /** The agency's kind of payment, e.g. "Månad", "Daglig" or "preliminär". */
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsNumber() netAmount?: number;
  @IsOptional() @IsNumber() grossAmount?: number;
  @IsOptional() @IsNumber() deductionAmount?: number;
  @IsOptional() @IsNumber() taxAmount?: number;
  @IsOptional() @IsString() periodFrom?: string;
  @IsOptional() @IsString() periodTo?: string;
  /** A payment the agency has announced but not yet made. */
  @IsBoolean() preliminary!: boolean;
  /** The delförmåner, when the agency specifies the payment. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => SsbtekPaymentPart) parts!: SsbtekPaymentPart[];
}

/** A payment as read from one person's SSBTEK answer, before it is known whose it is. */
export type SsbtekAgencyPayment = Omit<SsbtekPayment, 'person'>;

/** The payments SSBTEK reports to the household — the sökande and any medsökande — in the period, newest first. */
export class SsbtekPaymentsView {
  /** The period asked about, `yyyy-MM-dd` — careM's default is the SSBTEK rule periods (month M−2 through M). */
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SsbtekPayment) payments!: SsbtekPayment[];
  /** Whether the errand has a medsökande, whose payments are then listed too. */
  @IsBoolean() hasCoApplicant!: boolean;
  /** The errand has a medsökande, but SSBTEK could not be read for them: only the sökandes payments are listed. */
  @IsBoolean() coApplicantUnavailable!: boolean;
}

export class SsbtekPaymentsApiResponse implements ApiResponse<SsbtekPaymentsView> {
  @ValidateNested() @Type(() => SsbtekPaymentsView) data!: SsbtekPaymentsView;
  @IsString() message!: string;
}
