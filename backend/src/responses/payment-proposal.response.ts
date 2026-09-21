import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * The utbetalningsförslag (payment proposal) behind the Utbetalning tab. caremanagement derives it on
 * every read from the calculation draft, the application and the applicant's previous Lifecare
 * payments — nothing here is stored, so the whole thing is read-only.
 */
export class PayeeView {
  @IsString() @IsOptional() name?: string;
  /** The Lifecare payment method as Lifecare names it (bankkonto, bankgiro, plusgiro, utbetalningskort, …). */
  @IsString() @IsOptional() paymentMethod?: string;
  @IsString() @IsOptional() clearing?: string;
  @IsString() @IsOptional() accountNumber?: string;
}

export class ProposedPaymentView {
  /** The 27th of the concerned month, moved to the Friday before when it falls on a weekend. */
  @IsString() @IsOptional() paymentDate?: string;
  @IsNumber() @IsOptional() amount?: number;
  @IsString() @IsOptional() concernedMonth?: string;
  @ValidateNested() @Type(() => PayeeView) @IsOptional() payee?: PayeeView;
  @IsString() @IsOptional() accountingCode?: string;
}

export class PreviousPaymentView {
  @IsString() @IsOptional() payDate?: string;
  @IsNumber() @IsOptional() amount?: number;
  @IsString() @IsOptional() concernedMonth?: string;
  @IsString() @IsOptional() paymentMethod?: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() clearing?: string;
  @IsString() @IsOptional() accountNumber?: string;
  @IsString() @IsOptional() message?: string;
}

/** A PAYMENT-section warning raised by the proposal; `typeDisplayName` is the label to show. */
export class PaymentProposalWarningView {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() type?: string;
  @IsString() @IsOptional() typeDisplayName?: string;
  @IsString() @IsOptional() message?: string;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() statusDisplayName?: string;
}

export class PaymentProposalView {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedPaymentView)
  @IsOptional()
  payments?: ProposedPaymentView[];
  /** Every distinct payee on the applicant's Lifecare payments the last 12 months — the dropdown options. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => PayeeView) @IsOptional() payeeOptions?: PayeeView[];
  /** PREVIOUS_PAYMENT or APPLICATION; null when no payee could be proposed. */
  @IsString() @IsOptional() payeeSource?: string;
  @ValidateNested() @Type(() => PreviousPaymentView) @IsOptional() previousPayment?: PreviousPaymentView;
  /** Why the proposal is incomplete (Swedish); null when it is complete. */
  @IsString() @IsOptional() explanation?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentProposalWarningView)
  @IsOptional()
  warnings?: PaymentProposalWarningView[];
}

export class PaymentProposalApiResponse implements ApiResponse<PaymentProposalView> {
  @ValidateNested()
  @Type(() => PaymentProposalView)
  data!: PaymentProposalView;
  @IsString() message!: string;
}
