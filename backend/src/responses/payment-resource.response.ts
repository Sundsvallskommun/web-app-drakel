import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * An utbetalning stored on the errand. `source` and `lifecareId` carry provenance the same way
 * `Monitoring` does: CASEWORKER for one authored in Draken, LIFECARE for one RPA read out of Lifecare,
 * with `lifecareId` as the idempotency key.
 *
 * `status` is server-managed: DRAFT on create, PENDING_REGISTRATION once a decision handed it to the
 * robot, then REGISTERED or FAILED when the robot reports back. REGISTERED means the utbetalning exists
 * in Lifecare, not that it has been paid out — whether it was effectuated is a separate question.
 */
export class PaymentView {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() source?: string;
  @IsString() @IsOptional() lifecareId?: string;
  @IsString() @IsOptional() status?: string;
  /** Lifecare's own message when the robot reported FAILED — shown to the handläggare as it came. */
  @IsString() @IsOptional() lifecareDetail?: string;
  @IsString() @IsOptional() paymentDate?: string;
  @IsNumber() @IsOptional() amount?: number;
  @IsString() @IsOptional() applicationMonth?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() reportedOnStakeholderIds?: string[];
  @IsString() @IsOptional() accountingDate?: string;
  @IsBoolean() @IsOptional() excludedFromPayment?: boolean;
  @IsString() @IsOptional() payeeStakeholderId?: string;
  @IsString() @IsOptional() paymentMethod?: string;
  @IsString() @IsOptional() payeeName?: string;
  @IsString() @IsOptional() payeeAddress?: string;
  @IsString() @IsOptional() payeeCareOf?: string;
  @IsString() @IsOptional() payeeZipCode?: string;
  @IsString() @IsOptional() payeeCity?: string;
  @IsString() @IsOptional() clearingNumber?: string;
  @IsString() @IsOptional() accountNumber?: string;
  @IsString() @IsOptional() accountingCode?: string;
  @IsString() @IsOptional() localPaymentNumber?: string;
  @IsString() @IsOptional() invoiceNumber?: string;
  @IsBoolean() @IsOptional() usesOcr?: boolean;
  @IsArray() @IsString({ each: true }) @IsOptional() messageLines?: string[];
  @IsString() @IsOptional() created?: string;
  @IsString() @IsOptional() modified?: string;
}

export class PaymentsApiResponse implements ApiResponse<PaymentView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PaymentView) data!: PaymentView[];
  @IsString() message!: string;
}

export class PaymentApiResponse implements ApiResponse<PaymentView | null> {
  @ValidateNested() @Type(() => PaymentView) @IsOptional() data!: PaymentView | null;
  @IsString() message!: string;
}
