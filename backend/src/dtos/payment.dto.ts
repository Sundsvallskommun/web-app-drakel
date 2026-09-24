import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * The utbetalning form's values, registered straight in Lifecare (see buildPaymentCreate). The payee goes
 * as its fields — name, account and address — the way Lifecare's own utbetalning copies them from the
 * chosen betalningsmottagare.
 *
 * `paymentMethod` is deliberately an unconstrained string: the value set comes from Lifecare, and it is
 * matched there by name.
 */
export class PaymentInputDto {
  @IsString() @IsOptional() paymentDate?: string;
  @IsNumber() @IsOptional() amount?: number;
  /** The month the utbetalning concerns, `yyyy-MM`. */
  @IsString() @IsOptional() applicationMonth?: string;
  @IsString() @IsOptional() paymentMethod?: string;
  @IsString() @IsOptional() payeeName?: string;
  @IsString() @IsOptional() payeeAddress?: string;
  @IsString() @IsOptional() payeeCareOf?: string;
  @IsString() @IsOptional() payeeZipCode?: string;
  @IsString() @IsOptional() payeeCity?: string;
  @IsString() @IsOptional() clearingNumber?: string;
  @IsString() @IsOptional() accountNumber?: string;
  /** Kontering — the ändamål (Lifecare `purpose`) among the insats's konteringsrader. */
  @IsString() @IsOptional() accountingCode?: string;
  @IsString() @IsOptional() localPaymentNumber?: string;
  @IsString() @IsOptional() invoiceNumber?: string;
  @IsBoolean() @IsOptional() usesOcr?: boolean;
  @IsArray() @IsString({ each: true }) @IsOptional() messageLines?: string[];
}
