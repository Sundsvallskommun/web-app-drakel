import { ApiResponse } from '@interfaces/api-service.interface';
import { LifecareRegisteredPaymentRaw } from '@interfaces/lifecare-payment.interface';
import { toMonth } from '@utils/lifecare-payment-proposal';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';

/** An utbetalning registered on the insats in Lifecare, as the Utbetalning tab lists it. */
export class LifecareRegisteredPaymentView {
  /** Lifecare's paymentId. */
  @IsNumber() id!: number;
  @IsString() payDate!: string;
  /** Avser månad as `yyyy-MM` (Lifecare keeps it as `yyyyMM`). */
  @IsString() concernedMonth!: string;
  @IsNumber() amount!: number;
  @IsString() paymentMethod!: string;
  /** Who it goes to. */
  @IsString() recipient!: string;
  @IsString() status!: string;
  /** Makulerad in Lifecare. */
  @IsBoolean() cancelled!: boolean;
}

export class LifecareRegisteredPaymentsApiResponse implements ApiResponse<LifecareRegisteredPaymentView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareRegisteredPaymentView) data!: LifecareRegisteredPaymentView[];
  @IsString() message!: string;
}

/** The insats's utbetalningar, newest payment date first. The account number is left behind. */
export const toRegisteredPayments = (raw: LifecareRegisteredPaymentRaw[]): LifecareRegisteredPaymentView[] =>
  raw
    .map(payment => ({
      id: payment.paymentId,
      payDate: payment.payDate,
      concernedMonth: toMonth(payment.concernedMonth),
      amount: payment.amount,
      paymentMethod: payment.paymentMethodText ?? '',
      recipient: payment.name ?? '',
      status: payment.statusText ?? '',
      cancelled: payment.cancellationDate !== '',
    }))
    .sort((first, second) => second.payDate.localeCompare(first.payDate));
