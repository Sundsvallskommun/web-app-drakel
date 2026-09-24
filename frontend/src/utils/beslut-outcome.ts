import { DecisionPhrase, LifecareDecisionTypeView } from '@data-contracts/backend/data-contracts';
import { NormberakningDraft } from '@services/normberakning-service';

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

const OUTCOMES: readonly BeslutOutcome[] = ['BIFALL', 'DELAVSLAG', 'AVSLAG'];

/**
 * careM's outcome as one Drakel registers. careM is the only source of the outcome: it decides it on the
 * normberäkning (on Lifecare's once it is saved there), so Drakel keeps no rule of its own.
 */
export const toBeslutOutcome = (value: string | undefined): BeslutOutcome | undefined =>
  OUTCOMES.find((outcome) => outcome === value);

/** The Lifecare beslutstyp an outcome is registered as, among those Lifecare offers the insats. */
export const decisionTypeFor = (
  types: LifecareDecisionTypeView[],
  outcome: BeslutOutcome
): LifecareDecisionTypeView | undefined =>
  types.find((type) => normalizedName(type.name).endsWith(DECISION_TYPE_NAME_ENDING[outcome]));

/** Whether a barn — living in the household or an umgängesbarn — is in the normberäkning. */
export const hasChildren = (draft: NormberakningDraft | undefined): boolean =>
  (draft?.persons ?? []).some(
    (person) =>
      !person.deleted && person.included === true && (person.role === 'CHILD' || person.role === 'VISITATION_CHILD')
  );

// The beslutsformuleringar a bifall's message starts from, by rubrik.
const BIFALL_PHRASE = 'bifall månad';
const BIFALL_WITH_CHILDREN_PHRASE = 'bifall månad med barn';

/** The beslutsformulering a bifall starts from: "Bifall månad", or "Bifall månad MED BARN" when there are barn. */
export const bifallPhraseFor = (phrases: DecisionPhrase[], withChildren: boolean): DecisionPhrase | undefined => {
  const wanted = withChildren ? BIFALL_WITH_CHILDREN_PHRASE : BIFALL_PHRASE;
  return phrases.find((phrase) => normalizedName(phrase.name) === wanted);
};
