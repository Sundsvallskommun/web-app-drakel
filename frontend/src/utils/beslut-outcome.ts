import { LifecareDecisionTypeView } from '@data-contracts/backend/data-contracts';
import { NormberakningDraft, NormExpenseRow } from '@services/normberakning-service';

import { isSurplus, NormResult } from './norm-result';

/** The outcome a beslut on the normberäkning comes to — careM's names for them. */
export type BeslutOutcome = 'BIFALL' | 'DELAVSLAG' | 'AVSLAG';

/**
 * The Lifecare beslutstyp each outcome is registered as. A delvis bifall is a bifall of what was approved,
 * so it goes as the bifall type. Matched on the end of the name, since Lifecare writes the prefix
 * inconsistently ("Ek" / "EK").
 */
const DECISION_TYPE_NAME_ENDING: Record<BeslutOutcome, string> = {
  BIFALL: 'ekonomiskt bistånd 12 kap 1, 7 §§ sol, bifall',
  DELAVSLAG: 'ekonomiskt bistånd 12 kap 1, 7 §§ sol, bifall',
  AVSLAG: 'ekonomiskt bistånd 12 kap 1, 7 §§ sol, avslag',
};

const normalizedName = (name: string): string => name.trim().replace(/\s+/g, ' ').toLowerCase();

/** A row approved in full: the handläggare's amount covers what was applied for. */
const approvedInFull = (row: NormExpenseRow): boolean =>
  row.appliedAmount === undefined || (row.effectiveAmount ?? 0) >= row.appliedAmount;

/** Whether every utgift and levnadskostnad i övrigt applied for is approved in full. */
export const allExpensesApproved = (draft: NormberakningDraft | undefined): boolean =>
  [...(draft?.expenses ?? []), ...(draft?.specialExpenses ?? [])].filter((row) => !row.deleted).every(approvedInFull);

/**
 * The outcome the normberäkning gives, by the rules: a normöverskott is an avslag; a normunderskott is a
 * bifall when everything applied for is approved, else a delvis bifall.
 */
export const outcomeFromNormResult = (result: NormResult, everythingApproved: boolean): BeslutOutcome => {
  if (isSurplus(result)) {
    return 'AVSLAG';
  }
  return everythingApproved ? 'BIFALL' : 'DELAVSLAG';
};

/** The Lifecare beslutstyp an outcome is registered as, among those Lifecare offers the insats. */
export const decisionTypeFor = (
  types: LifecareDecisionTypeView[],
  outcome: BeslutOutcome
): LifecareDecisionTypeView | undefined =>
  types.find((type) => normalizedName(type.name).endsWith(DECISION_TYPE_NAME_ENDING[outcome]));
