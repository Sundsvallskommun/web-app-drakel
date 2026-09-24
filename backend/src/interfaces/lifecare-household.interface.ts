/**
 * Lifecare's hushåll (`Household/*`) and the persons a beräkning can take in (`Calculation/FindCalculationCandidates`,
 * `Calculation/GetProposalForPerson`), from the capture of 2026-09-24. Only the fields drakel reads are named.
 * Every one of these carries personnummer: never log them.
 */

/** A member of a hushåll, with Lifecare's relation to the household head. */
interface LifecareHouseholdMemberRaw {
  personId: string;
  name: string;
  relationType: number;
  relationText: string | null;
  householdHead: boolean;
  deviatingFromDate: string;
  deviatingToDate: string;
  coApplicant: boolean;
  markedForRemoval: boolean;
  personIdFormatted: string;
  [field: string]: unknown;
}

/** A bonusbarn — a child living in the hushåll part of the time, not a member of it. */
interface LifecareHouseholdBonusChildRaw {
  personId: string;
  name: string;
  markedForRemoval: boolean;
  personIdFormatted: string;
  [field: string]: unknown;
}

export interface LifecareHouseholdRaw {
  householdId: number;
  personId: string;
  fromDate: string;
  toDate: string;
  householdMembers: LifecareHouseholdMemberRaw[];
  householdBonusChildren: LifecareHouseholdBonusChildRaw[];
  [field: string]: unknown;
}

/** `Household/ListHouseholdsForPerson`: every hushåll the person has had, each with its period. */
export interface LifecareHouseholdsRaw {
  households: LifecareHouseholdRaw[];
  [field: string]: unknown;
}

/** A person `Calculation/FindCalculationCandidates` found for the search text. */
export interface LifecareCalculationCandidateRaw {
  personId: string;
  name: string;
  personIdFormatted: string;
}
