import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * What happened when an utbetalning was to be registered in Lifecare.
 * - REGISTERED: it is in Lifecare (not the same as paid out).
 * - FAILED: Lifecare refused it; `detail` is Lifecare's reason, and careM has it too.
 * - NOT_SENT: it was never sent — `detail` says why — and can be registered again once that is fixed.
 */
export class PaymentRegistration {
  @IsString() paymentId!: string;
  @IsIn(['REGISTERED', 'FAILED', 'NOT_SENT']) outcome!: 'REGISTERED' | 'FAILED' | 'NOT_SENT';
  @IsString() @IsOptional() lifecareId?: string;
  @IsString() @IsOptional() detail?: string;
}

export class PaymentRegistrationApiResponse implements ApiResponse<PaymentRegistration> {
  @ValidateNested() @Type(() => PaymentRegistration) data!: PaymentRegistration;
  @IsString() message!: string;
}
