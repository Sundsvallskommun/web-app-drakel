import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Fields accepted when creating (POST) or replacing (PUT) an utbetalning on an errand. `source`,
 * `status`, `id` and the timestamps are server-owned — a handläggare only sends the form's own values,
 * and caremanagement creates the payment as DRAFT without queueing anything for the robot.
 *
 * `moneyType` and `paymentMethod` are deliberately unconstrained strings: the value sets come from
 * Lifecare and are served through the metadata endpoint rather than fixed in the API.
 */
export class PaymentInputDto {
  @IsString() @IsOptional() moneyType?: string;
  @IsString() @IsOptional() paymentDate?: string;
  @IsNumber() @IsOptional() amount?: number;
  @IsString() @IsOptional() applicationMonth?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() reportedOnStakeholderIds?: string[];
  @IsString() @IsOptional() accountingDate?: string;
  @IsBoolean() @IsOptional() excludedFromPayment?: boolean;
  @IsString() @IsOptional() payeeStakeholderId?: string;
  @IsString() @IsOptional() paymentMethod?: string;
  @IsString() @IsOptional() payeeName?: string;
  @IsString() @IsOptional() payeeAddress?: string;
  @IsString() @IsOptional() payeeCareOf?: string;
  @IsString() @IsOptional() payeeZipCode?: string;
  @IsString() @IsOptional() payeeCity?: string;
  @IsString() @IsOptional() clearingNumber?: string;
  @IsString() @IsOptional() accountNumber?: string;
  @IsString() @IsOptional() localPaymentNumber?: string;
  @IsString() @IsOptional() invoiceNumber?: string;
  @IsBoolean() @IsOptional() usesOcr?: boolean;
  @IsArray() @IsString({ each: true }) @IsOptional() messageLines?: string[];
}
