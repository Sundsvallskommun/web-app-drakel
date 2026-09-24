import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

/** An utbetalning registered in Lifecare (not the same as paid out). */
export class LifecarePaymentCreated {
  /** Lifecare's id for the new utbetalning. */
  @IsString() lifecareId!: string;
}

export class LifecarePaymentCreatedApiResponse implements ApiResponse<LifecarePaymentCreated> {
  @ValidateNested() @Type(() => LifecarePaymentCreated) data!: LifecarePaymentCreated;
  @IsString() message!: string;
}
