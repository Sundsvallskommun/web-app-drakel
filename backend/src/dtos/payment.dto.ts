import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Fields accepted when creating (POST) or replacing (PUT) an utbetalning on an errand. `source`,
 * `status`, `id` and the timestamps are server-owned — a handläggare only sends the form's own values,
 * and caremanagement creates the payment as DRAFT without queueing anything for the robot.
 *
 * `paymentMethod` is deliberately an unconstrained string: the value set comes from Lifecare and is
 * served through the metadata endpoint rather than fixed in the API.
 */
export class PaymentInputDto {
  @IsString() @IsOptional() paymentDate?: string;
  @IsNumber() @IsOptional() amount?: number;
  @IsString() @IsOptional() applicationMonth?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() reportedOnStakeholderIds?: string[];
  @IsString() @IsOptional() accountingDate?: string;
  @IsBoolean() @IsOptional() excludedFromPayment?: boolean;
  /**
   * The id of the fa_payee row the recipient was picked from. It is what hands the REGISTER_PAYMENT robot
   * the payee's Lifecare id instead of leaving it to match on name and account number. Absent for a payee
   * derived from the Lifecare payment history — those rows have no id.
   */
  @IsString() @IsOptional() payeeId?: string;
  @IsString() @IsOptional() payeeStakeholderId?: string;
  @IsString() @IsOptional() paymentMethod?: string;
  @IsString() @IsOptional() payeeName?: string;
  @IsString() @IsOptional() payeeAddress?: string;
  @IsString() @IsOptional() payeeCareOf?: string;
  @IsString() @IsOptional() payeeZipCode?: string;
  @IsString() @IsOptional() payeeCity?: string;
  @IsString() @IsOptional() clearingNumber?: string;
  @IsString() @IsOptional() accountNumber?: string;
  /** Kontering — free text; FamilyCare exposes no catalogue of accounting codes. */
  @IsString() @IsOptional() accountingCode?: string;
  @IsString() @IsOptional() localPaymentNumber?: string;
  @IsString() @IsOptional() invoiceNumber?: string;
  @IsBoolean() @IsOptional() usesOcr?: boolean;
  @IsArray() @IsString({ each: true }) @IsOptional() messageLines?: string[];
}
