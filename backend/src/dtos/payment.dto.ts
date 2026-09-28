import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsPositive, IsString, Matches, Max, MaxLength } from 'class-validator';

/** Far above any single utbetalning of ekonomiskt bistånd; an amount beyond it is a typing error, not a payment. */
const MAX_PAYMENT_AMOUNT = 1_000_000;

/** A text field of the form: a name, an address line, a kontering. */
const MAX_TEXT_LENGTH = 255;

/** A number field of the form: a clearing, account, OCR or invoice number, a postal code. */
const MAX_NUMBER_FIELD_LENGTH = 64;

/** careM sends at most seven message rows on to Lifecare; this only bounds the request, the form decides the rows. */
const MAX_MESSAGE_LINES = 50;

/**
 * The utbetalning form's values, passed on as they are to careM, which registers them in Lifecare (careM's
 * `LifecarePaymentRequest`). The payee goes as its fields — name, account and address — the way Lifecare's own
 * utbetalning copies them from the chosen betalningsmottagare.
 *
 * `paymentMethod` is deliberately an unconstrained string: the value set comes from Lifecare, and it is
 * matched there by name. The bounds below only keep out what cannot be a payment: an amount of zero or less, a
 * month or date that is not one, text of any length.
 */
export class PaymentInputDto {
  /** Utbetalningsdatum, `yyyy-MM-dd` as the form's date picker gives it. */
  @IsDateString() @IsOptional() paymentDate?: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() @Max(MAX_PAYMENT_AMOUNT) @IsOptional() amount?: number;
  /** The month the utbetalning concerns, `yyyy-MM`. */
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'applicationMonth must be a month as yyyy-MM' }) @IsOptional() applicationMonth?: string;
  @IsString() @MaxLength(MAX_TEXT_LENGTH) @IsOptional() paymentMethod?: string;
  @IsString() @MaxLength(MAX_TEXT_LENGTH) @IsOptional() payeeName?: string;
  @IsString() @MaxLength(MAX_TEXT_LENGTH) @IsOptional() payeeAddress?: string;
  @IsString() @MaxLength(MAX_TEXT_LENGTH) @IsOptional() payeeCareOf?: string;
  @IsString() @MaxLength(MAX_NUMBER_FIELD_LENGTH) @IsOptional() payeeZipCode?: string;
  @IsString() @MaxLength(MAX_TEXT_LENGTH) @IsOptional() payeeCity?: string;
  @IsString() @MaxLength(MAX_NUMBER_FIELD_LENGTH) @IsOptional() clearingNumber?: string;
  @IsString() @MaxLength(MAX_NUMBER_FIELD_LENGTH) @IsOptional() accountNumber?: string;
  /** Kontering — the ändamål (Lifecare `purpose`) among the insats's konteringsrader. */
  @IsString() @MaxLength(MAX_TEXT_LENGTH) @IsOptional() accountingCode?: string;
  @IsString() @MaxLength(MAX_NUMBER_FIELD_LENGTH) @IsOptional() localPaymentNumber?: string;
  @IsString() @MaxLength(MAX_NUMBER_FIELD_LENGTH) @IsOptional() invoiceNumber?: string;
  @IsBoolean() @IsOptional() usesOcr?: boolean;
  @IsArray()
  @ArrayMaxSize(MAX_MESSAGE_LINES)
  @IsString({ each: true })
  @MaxLength(MAX_TEXT_LENGTH, { each: true })
  @IsOptional()
  messageLines?: string[];
}
