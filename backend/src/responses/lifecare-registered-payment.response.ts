import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';

import { LifecareRegisteredPayment } from '@/data-contracts/caremanagement/data-contracts';

/** An utbetalning registered on the insats in Lifecare, as the Utbetalning tab lists it. */
export class LifecareRegisteredPaymentView {
  /** Lifecare's paymentId. */
  @IsNumber() id!: number;
  @IsString() payDate!: string;
  /** Avser månad as `yyyy-MM`. */
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

/**
 * One of careM's utbetalningar in drakel's shape — the same fields; careM declares every one of them optional, and
 * what it lacks is left empty here.
 */
export const toRegisteredPaymentView = (payment: LifecareRegisteredPayment): LifecareRegisteredPaymentView => ({
  id: payment.id ?? 0,
  payDate: payment.payDate ?? '',
  concernedMonth: payment.concernedMonth ?? '',
  amount: payment.amount ?? 0,
  paymentMethod: payment.paymentMethod ?? '',
  recipient: payment.recipient ?? '',
  status: payment.status ?? '',
  cancelled: payment.cancelled ?? false,
});
