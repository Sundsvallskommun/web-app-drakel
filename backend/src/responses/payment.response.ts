import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

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
