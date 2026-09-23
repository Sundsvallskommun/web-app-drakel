import { ApiResponse } from '@interfaces/api-service.interface';
import { LifecarePayeeRaw, LifecarePaymentForCreateRaw, LifecarePaymentMethodRaw } from '@interfaces/lifecare-payment.interface';
import { ADDRESS_PAYEE_ID } from '@utils/lifecare-payee';
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

/** The betalsätt and betalningsmottagare an utbetalning on the insats can use — Lifecare's own lists. */
export class LifecarePaymentOptionsView {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecarePaymentMethodView) paymentMethods!: LifecarePaymentMethodView[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecarePayeeView) payees!: LifecarePayeeView[];
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

/** The betalsätt in use and the active payees, out of Lifecare's underlag for a new utbetalning. */
export const toPaymentOptions = (raw: LifecarePaymentForCreateRaw): LifecarePaymentOptionsView => ({
  paymentMethods: raw.paymentMethods.filter(method => method.inUse).map(toMethodView),
  payees: raw.payees.filter(payee => payee.isActive).map(payee => toPayeeView(payee, raw.paymentMethods)),
});
