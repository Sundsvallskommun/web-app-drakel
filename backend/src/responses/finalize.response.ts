import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { DecisionRegistration } from '@/responses/decision-registration.response';
import { PaymentRegistration } from '@/responses/payment-registration.response';

/**
 * The outcome of "Besluta och utbetala". The errand is finalized whenever this comes back — what follows
 * lists the parts after that which did not go through, so the handläggare can act on them.
 */
export class FinalizeResult {
  /** The PAYMENT decision caremanagement recorded. */
  @IsString() @IsOptional() decisionId?: string;
  /** The payment rows finalize created, in the order the drafts were sent. */
  @IsArray() @IsString({ each: true }) paymentIds!: string[];
  /** Payees caremanagement warned about — a payment cannot be registered against a payee Lifecare lacks. */
  @IsArray() @IsString({ each: true }) payeeWarnings!: string[];
  /** The Lifecare write-backs caremanagement could not queue (e.g. REGISTER_PAYMENT). */
  @IsArray() @IsString({ each: true }) failedRpaTasks!: string[];
  /** Whether the process was told about the decision — false leaves it waiting for one. */
  @IsBoolean() processMessageCorrelated!: boolean;
  /** How registering the beslut in Lifecare went; absent when finalize recorded no beslut. */
  @ValidateNested() @Type(() => DecisionRegistration) @IsOptional() lifecareDecision?: DecisionRegistration;
  /** How registering each new utbetalning in Lifecare went. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => PaymentRegistration) lifecarePayments!: PaymentRegistration[];
  /** The channels the beslut could not be sent through. */
  @IsArray() @IsString({ each: true }) failedChannels!: string[];
}

export class FinalizeApiResponse implements ApiResponse<FinalizeResult> {
  @ValidateNested() @Type(() => FinalizeResult) data!: FinalizeResult;
  @IsString() message!: string;
}
