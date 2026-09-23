import { ApiResponse } from '@interfaces/api-service.interface';
import { LifecarePayeeRaw, LifecarePaymentForCreateRaw, LifecarePaymentMethodRaw } from '@interfaces/lifecare-payment.interface';
import { ADDRESS_PAYEE_ID } from '@utils/lifecare-payee';
import { LifecarePaymentProposal, toMonth } from '@utils/lifecare-payment-proposal';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A betalsätt the insats offers, as Lifecare lists it. */
export class LifecarePaymentMethodView {
  /** Lifecare's betalsätt code. */
  @IsNumber() code!: number;
  @IsString() name!: string;
  /** Whether Lokalbetalningsnummer is open for this betalsätt, and whether it must be filled in. */
  @IsBoolean() localNumberEnabled!: boolean;
  @IsBoolean() localNumberMandatory!: boolean;
}

/** A betalningsmottagare in Lifecare, with the account and address an utbetalning to it copies. */
export class LifecarePayeeView {
  /** Lifecare's payee id. */
  @IsNumber() id!: number;
  /** The label the payee has in Lifecare's list. */
  @IsString() label!: string;
  /** The account holder. */
  @IsString() name!: string;
  @IsNumber() paymentMethodCode!: number;
  /** The betalsätt's name, as the utbetalning stores it. */
  @IsString() paymentMethod!: string;
  @IsString() clearing!: string;
  @IsString() accountNumber!: string;
  @IsString() streetAddress!: string;
  @IsString() careOfAddress!: string;
  @IsString() postalCode!: string;
  @IsString() postalAddress!: string;
  /** Lifecare's "Adress" entry — pays to the client's registered address rather than an account. */
  @IsBoolean() toRegisteredAddress!: boolean;
}

/** A konteringsrad on the insats: the ändamål an utbetalning can be booked on. */
export class LifecarePostingView {
  /** Lifecare's ändamål code — what the utbetalning keeps as its kontering. */
  @IsNumber() purpose!: number;
  @IsString() text!: string;
}

/** A saldo on the insats: what the beslut granted, what is already booked, and what is left. */
export class LifecareBalanceView {
  @IsString() name!: string;
  @IsNumber() approvedAmount!: number;
  @IsNumber() bookedAmount!: number;
  @IsNumber() balanceAmount!: number;
}

/** A month an utbetalning on the insats may concern, as Lifecare offers it. */
export class LifecareConcernMonthView {
  /** `yyyy-MM`. */
  @IsString() month!: string;
  /** Lifecare's own wording, e.g. "September 2026". */
  @IsString() label!: string;
}

/** What the utbetalning form starts from — Lifecare's own figures, all changeable. */
export class LifecarePaymentProposalView {
  @IsString() @IsOptional() paymentDate?: string;
  @IsString() @IsOptional() concernedMonth?: string;
  /** What is left on the saldo. */
  @IsNumber() @IsOptional() amount?: number;
  /** The payee the latest utbetalning on the insats went to. */
  @IsNumber() @IsOptional() payeeId?: number;
}

/** The betalsätt, betalningsmottagare and ändamål an utbetalning on the insats can use — Lifecare's own lists. */
export class LifecarePaymentOptionsView {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecarePaymentMethodView) paymentMethods!: LifecarePaymentMethodView[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecarePayeeView) payees!: LifecarePayeeView[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecarePostingView) postings!: LifecarePostingView[];
  /** The insats's saldon — what is left to pay out, as Lifecare counts it. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareBalanceView) balances!: LifecareBalanceView[];
  /** The months an utbetalning may concern. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareConcernMonthView) concernMonths!: LifecareConcernMonthView[];
  @ValidateNested() @Type(() => LifecarePaymentProposalView) proposal!: LifecarePaymentProposalView;
}

export class LifecarePaymentOptionsApiResponse implements ApiResponse<LifecarePaymentOptionsView> {
  @ValidateNested() @Type(() => LifecarePaymentOptionsView) data!: LifecarePaymentOptionsView;
  @IsString() message!: string;
}

export class LifecarePayeeApiResponse implements ApiResponse<LifecarePayeeView> {
  @ValidateNested() @Type(() => LifecarePayeeView) @IsOptional() data!: LifecarePayeeView;
  @IsString() message!: string;
}

const toMethodView = (method: LifecarePaymentMethodRaw): LifecarePaymentMethodView => ({
  code: method.paymentCode,
  name: method.payment,
  localNumberEnabled: method.localNumberEnabled,
  localNumberMandatory: method.localNumberMandatory,
});

/** A Lifecare payee row as the UI shows it; the personnummer on the row is left behind. */
export const toPayeeView = (payee: LifecarePayeeRaw, methods: LifecarePaymentMethodRaw[] = []): LifecarePayeeView => ({
  id: payee.payeeId,
  label: payee.payeeName ?? payee.name ?? '',
  name: payee.name ?? '',
  paymentMethodCode: payee.paymentMethod,
  // The "Adress" entry has no betalsätt text of its own; the list of betalsätt names the code when it can.
  paymentMethod: payee.paymentMethodText ?? methods.find(method => method.paymentCode === payee.paymentMethod)?.payment ?? '',
  clearing: payee.clearing ?? '',
  accountNumber: payee.accountNumber ?? '',
  streetAddress: payee.streetAddress ?? '',
  careOfAddress: payee.careOfAddress ?? '',
  postalCode: payee.postalCode ?? '',
  postalAddress: payee.postalAddress ?? '',
  toRegisteredAddress: payee.payeeId === ADDRESS_PAYEE_ID,
});

/** Everything the utbetalning form needs, out of Lifecare's underlag for a new utbetalning. */
export const toPaymentOptions = (raw: LifecarePaymentForCreateRaw, proposal: LifecarePaymentProposal): LifecarePaymentOptionsView => ({
  paymentMethods: raw.paymentMethods.filter(method => method.inUse).map(toMethodView),
  payees: raw.payees.filter(payee => payee.isActive).map(payee => toPayeeView(payee, raw.paymentMethods)),
  postings: (raw.payment.postings ?? []).map(posting => ({ purpose: posting.purpose, text: posting.purposeText ?? String(posting.purpose) })),
  balances: (raw.balances ?? []).map(balance => ({
    name: balance.name.trim(),
    approvedAmount: balance.approvedAmount,
    bookedAmount: balance.bookedAmount,
    balanceAmount: balance.balanceAmount,
  })),
  concernMonths: (raw.paymentConcernMonths ?? []).map(month => ({ month: toMonth(month.concernMonth), label: month.displayMonth })),
  proposal,
});
