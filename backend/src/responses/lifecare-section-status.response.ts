import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

/** Which of the errand's sections Lifecare has as done — the checks on the Normberäkning, Beslut and Utbetalning tabs. */
export class LifecareSectionStatusView {
  /** The errand's beräkning is saved as slutlig in Lifecare. */
  @IsBoolean() calculationFinalized!: boolean;
  /** The errand's beslut is saved in Lifecare. */
  @IsBoolean() decisionSaved!: boolean;
  /** An utbetalning for the errand's month is registered in Lifecare. */
  @IsBoolean() paymentRegistered!: boolean;
}

export class LifecareSectionStatusApiResponse implements ApiResponse<LifecareSectionStatusView> {
  @ValidateNested() @Type(() => LifecareSectionStatusView) data!: LifecareSectionStatusView;
  @IsString() message!: string;
}
