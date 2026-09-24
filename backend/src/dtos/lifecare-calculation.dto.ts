import { IsBoolean, IsOptional } from 'class-validator';

/** How the errand's draft normberäkning is saved in Lifecare. */
export class SaveLifecareCalculationDto {
  /** Save it as slutlig: Lifecare then allows no further change. */
  @IsBoolean()
  @IsOptional()
  finalize?: boolean;
}
