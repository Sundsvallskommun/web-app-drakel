import { IsString, MinLength } from 'class-validator';

/** The text to search Lifecare's persons by — a name or a personnummer. Sent in the body to keep it out of URLs. */
export class FindHouseholdCandidatesDto {
  @IsString() @MinLength(2) filter!: string;
}

/** A person by Lifecare's id (the personnummer), sent in the body to keep it out of URLs. */
export class HouseholdPersonDto {
  @IsString() personId!: string;
}
