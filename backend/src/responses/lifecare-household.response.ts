import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * A person in the sökandes hushåll in Lifecare — a member or a bonusbarn — and whether the errand's beräkning
 * takes them in. `personId` is Lifecare's id (the personnummer); it goes back in a request body, never a URL.
 */
export class HouseholdPersonView {
  @IsString() personId!: string;
  @IsString() personalNumber!: string;
  @IsString() name!: string;
  /** Lifecare's relation to the household head, e.g. "Ensamstående"; absent for a bonusbarn. */
  @IsString() @IsOptional() relation?: string;
  @IsBoolean() bonusChild!: boolean;
  @IsBoolean() inCalculation!: boolean;
}

/** The sökandes hushåll for the beräkning's period, as Lifecare holds it. */
export class LifecareHouseholdView {
  @IsArray() @ValidateNested({ each: true }) @Type(() => HouseholdPersonView) persons!: HouseholdPersonView[];
}

export class LifecareHouseholdApiResponse implements ApiResponse<LifecareHouseholdView> {
  @ValidateNested() @Type(() => LifecareHouseholdView) data!: LifecareHouseholdView;
  @IsString() message!: string;
}

/** A person Lifecare found for a search — one who can be added as a bonusbarn. */
export class HouseholdCandidateView {
  @IsString() personId!: string;
  @IsString() personalNumber!: string;
  @IsString() name!: string;
}

export class HouseholdCandidatesApiResponse implements ApiResponse<HouseholdCandidateView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => HouseholdCandidateView) data!: HouseholdCandidateView[];
  @IsString() message!: string;
}
