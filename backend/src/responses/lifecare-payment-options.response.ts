import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import {
  LifecarePayee,
  LifecarePaymentBalance,
  LifecarePaymentConcernMonth,
  LifecarePaymentMethod,
  LifecarePaymentOptions,
  LifecarePaymentPosting,
  LifecarePaymentProposal,
} from '@/data-contracts/caremanagement/data-contracts';

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

// careM answers with the same field names as the views above, but declares every field optional (and writes null
// for what it has not got). The mappers below keep drakel's contract: required fields are filled in, optional
// ones are left out rather than null.

const toMethodView = (method: LifecarePaymentMethod): LifecarePaymentMethodView => ({
  code: method.code ?? 0,
  name: method.name ?? '',
  localNumberEnabled: method.localNumberEnabled ?? false,
  localNumberMandatory: method.localNumberMandatory ?? false,
});

const toPostingView = (posting: LifecarePaymentPosting): LifecarePostingView => ({
  purpose: posting.purpose ?? 0,
  text: posting.text ?? '',
});

const toBalanceView = (balance: LifecarePaymentBalance): LifecareBalanceView => ({
  name: balance.name ?? '',
  approvedAmount: balance.approvedAmount ?? 0,
  bookedAmount: balance.bookedAmount ?? 0,
  balanceAmount: balance.balanceAmount ?? 0,
});

const toConcernMonthView = (month: LifecarePaymentConcernMonth): LifecareConcernMonthView => ({
  month: month.month ?? '',
  label: month.label ?? '',
});

const toProposalView = (proposal: LifecarePaymentProposal | undefined): LifecarePaymentProposalView => ({
  paymentDate: proposal?.paymentDate ?? undefined,
  concernedMonth: proposal?.concernedMonth ?? undefined,
  amount: proposal?.amount ?? undefined,
  payeeId: proposal?.payeeId ?? undefined,
});

/** A betalningsmottagare as careM answers it, in drakel's shape. */
export const toPayeeView = (payee: LifecarePayee): LifecarePayeeView => ({
  id: payee.id ?? 0,
  label: payee.label ?? '',
  name: payee.name ?? '',
  paymentMethodCode: payee.paymentMethodCode ?? 0,
  paymentMethod: payee.paymentMethod ?? '',
  clearing: payee.clearing ?? '',
  accountNumber: payee.accountNumber ?? '',
  streetAddress: payee.streetAddress ?? '',
  careOfAddress: payee.careOfAddress ?? '',
  postalCode: payee.postalCode ?? '',
  postalAddress: payee.postalAddress ?? '',
  toRegisteredAddress: payee.toRegisteredAddress ?? false,
});

/** Everything the utbetalning form needs, as careM answers it, in drakel's shape. */
export const toPaymentOptionsView = (options: LifecarePaymentOptions): LifecarePaymentOptionsView => ({
  paymentMethods: (options.paymentMethods ?? []).map(toMethodView),
  payees: (options.payees ?? []).map(toPayeeView),
  postings: (options.postings ?? []).map(toPostingView),
  balances: (options.balances ?? []).map(toBalanceView),
  concernMonths: (options.concernMonths ?? []).map(toConcernMonthView),
  proposal: toProposalView(options.proposal),
});
