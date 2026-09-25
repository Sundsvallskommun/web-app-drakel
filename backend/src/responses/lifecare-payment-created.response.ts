import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

import { LifecarePaymentCreated as CaremanagementLifecarePaymentCreated } from '@/data-contracts/caremanagement/data-contracts';

/** An utbetalning registered in Lifecare (not the same as paid out). */
export class LifecarePaymentCreated {
  /** Lifecare's id for the new utbetalning. */
  @IsString() lifecareId!: string;
  /**
   * Whether careM linked the utbetalning to the errand. False means it IS registered in Lifecare but the errand does
   * not point at it: the handläggare must be told not to register it again.
   */
  @IsBoolean() linkedToErrand!: boolean;
}

export class LifecarePaymentCreatedApiResponse implements ApiResponse<LifecarePaymentCreated> {
  @ValidateNested() @Type(() => LifecarePaymentCreated) data!: LifecarePaymentCreated;
  @IsString() message!: string;
}

/**
 * careM's answer to a registered utbetalning. An answer that does not say the errand was linked is read as not
 * linked — the reading that keeps the handläggare from paying twice.
 */
export const toPaymentCreated = (created: CaremanagementLifecarePaymentCreated): LifecarePaymentCreated => ({
  lifecareId: created.lifecareId ?? '',
  linkedToErrand: created.linkedToErrand ?? false,
});
