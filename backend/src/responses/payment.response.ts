import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { LifecarePaymentStatus } from '@/data-contracts/caremanagement/data-contracts';

/** Whether the Lifecare utbetalning for an errand's application month has been effectuated. */
export class PaymentStatusView {
  /** The application month (yyyy-MM) the status concerns. */
  @IsString()
  @IsOptional()
  applicationMonth?: string;
  /** True when a Lifecare utbetalning concerning the application month has been registered. */
  @IsBoolean()
  effectuated!: boolean;
  /** The date the utbetalning was made (Lifecare PayDate), when effectuated. */
  @IsString()
  @IsOptional()
  paymentDate?: string;
  /** The amount of that utbetalning, when effectuated. */
  @IsNumber()
  @IsOptional()
  amount?: number;
  /** Lifecare's own status for that utbetalning, e.g. "Utbetald", when effectuated. */
  @IsString()
  @IsOptional()
  status?: string;
  /** True when the status could not be determined (missing applicant/month, or Lifecare unavailable). */
  @IsBoolean()
  unavailable!: boolean;
}

export class PaymentStatusApiResponse implements ApiResponse<PaymentStatusView> {
  @ValidateNested()
  @Type(() => PaymentStatusView)
  data!: PaymentStatusView;
  @IsString()
  message!: string;
}

/** The status as careM answers it, in drakel's shape. */
export const toPaymentStatusView = (status: LifecarePaymentStatus): PaymentStatusView => ({
  // careM writes null for what it has not got; drakel's status leaves those fields out.
  applicationMonth: status.applicationMonth ?? undefined,
  effectuated: status.effectuated ?? false,
  paymentDate: status.paymentDate ?? undefined,
  amount: status.amount ?? undefined,
  status: status.status ?? undefined,
  unavailable: status.unavailable ?? false,
});
