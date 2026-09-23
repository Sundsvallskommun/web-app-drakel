import { LifecareDecisionProposalRaw, LifecareDecisionReasonRaw } from '@interfaces/lifecare-decision.interface';

/**
 * Which Lifecare beslutstyp each of careM's outcomes is registered as. Lifecare offers several bifall and
 * avslag types (12 kap 2 §, yttersta ansvaret, förskott …); ekonomiskt bistånd under 12 kap 1, 7 §§ SoL
 * is these two. DELAVSLAG ("Delvis bifall") has no mapping on purpose: how verksamheten registers it in
 * Lifecare is not settled, so it is stopped rather than guessed.
 */
const DECISION_CODE_BY_OUTCOME: Partial<Record<string, number>> = {
  BIFALL: 153,
  AVSLAG: 152,
};

/** What the web app sends as `coApplicant` when the household has no medsökande. */
const NO_CO_APPLICANT = 'NOONE';

/** The beslut to register, as the handläggare decided it in "Besluta och utbetala". */
export interface LifecareDecisionInput {
  /** careM's outcome code: BIFALL, AVSLAG or DELAVSLAG. */
  outcome: string;
  periodFrom?: string;
  periodTo?: string;
  amount?: number;
  /** The orsak's code in Lifecare's catalogue. */
  reasonCode: number;
  /** The beslutsmeddelande as HTML. */
  message?: string;
  /** The beslutsfattare's signature — the handläggare's own account. */
  decisionMakerId: string;
}

/** Either the `Decision/Create` body, or why the beslut cannot be registered as it stands. */
export type DecisionCreate = { writable: true; body: Record<string, unknown> } | { writable: false; reason: string };

const refuse = (reason: string): DecisionCreate => ({ writable: false, reason });

/** A careM date (possibly with a time) as Lifecare's `yyyy-MM-dd`; an empty string when there is none. */
const toLifecareDate = (value: string | undefined): string => (value ?? '').slice(0, 10);

/**
 * The code of the orsak careM recorded, found among the leaves of Lifecare's catalogue by its wording —
 * careM keeps the orsak as Lifecare's own text. Undefined when the catalogue has no such orsak.
 */
export const findReasonCode = (catalogue: LifecareDecisionReasonRaw[], reason: string): number | undefined => {
  const wanted = reason.trim().toLowerCase();
  for (const node of catalogue) {
    if (node.reasonCode !== null && node.name.trim().toLowerCase() === wanted) {
      return node.reasonCode;
    }
    const inOptions = findReasonCode(node.options, reason);
    if (inOptions !== undefined) {
      return inOptions;
    }
  }
  return undefined;
};

/** The Lifecare beslutstyp code for a careM outcome, when there is a settled one. */
export const decisionCodeFor = (outcome: string): number | undefined => DECISION_CODE_BY_OUTCOME[outcome];

/**
 * Builds the `Decision/Create` body the way Lifecare's web app does (capture 2026-09-23): the underlag's
 * own `decision`, in its own field order, with the handläggare's choices filled in — beslutstyp, period,
 * orsak, belopp, beslutsfattare and meddelande — every person marked as included, and the fields the web
 * app adds and drops treated as it treats them.
 *
 * A wrong beslut is accepted by Lifecare without complaint and a second call makes a second one, so
 * anything that cannot be decided safely is refused instead of sent:
 * - "Delvis bifall", which has no settled registration in Lifecare yet;
 * - a household with a medsökande — sending "NOONE" for one is accepted and silently leaves them out of
 *   the beslut, and how a medsökande is registered is not captured yet;
 * - a beslutsfattare Lifecare does not know — the beslut must name the handläggare, never fall back on
 *   the service account;
 * - a period the beslutstyp requires but the beslut lacks.
 */
export const buildDecisionCreate = (proposal: LifecareDecisionProposalRaw, input: LifecareDecisionInput): DecisionCreate => {
  const code = decisionCodeFor(input.outcome);
  if (code === undefined) {
    return refuse(
      input.outcome === 'DELAVSLAG'
        ? 'Delvis bifall kan inte registreras i Lifecare från Drakel ännu. Registrera beslutet direkt i Lifecare.'
        : `Beslutet "${input.outcome}" går inte att registrera i Lifecare.`,
    );
  }
  const decisionType = proposal.decisionTypes.find(candidate => candidate.code === code && candidate.isActive);
  if (!decisionType) {
    return refuse(`Beslutstypen ${String(code)} finns inte på insatsen i Lifecare.`);
  }

  if (proposal.decision.decisionPersons.some(person => person.coApplicant)) {
    return refuse('Hushållet har en medsökande. Sådana beslut kan inte registreras i Lifecare från Drakel ännu.');
  }

  const signature = input.decisionMakerId.toLowerCase();
  const decisionMaker = proposal.decisionMakers.find(candidate => candidate.id.toLowerCase() === signature);
  if (!decisionMaker) {
    return refuse(`Handläggaren ${input.decisionMakerId} finns inte som beslutsfattare i Lifecare.`);
  }

  const fromDate = toLifecareDate(input.periodFrom);
  const toDate = toLifecareDate(input.periodTo);
  if ((decisionType.requiresFromDate && !fromDate) || (decisionType.requiresToDate && !toDate)) {
    return refuse('Beslutet saknar period, som beslutstypen kräver i Lifecare.');
  }

  // Assigning onto a copy keeps each field where the underlag had it; the web app's own additions go last.
  const body: Record<string, unknown> = { ...proposal.decision };
  body.decisionCode = decisionType.code;
  body.fromDate = fromDate;
  body.toDate = toDate;
  body.reasonCode = input.reasonCode;
  body.reasonCodeCoApplicant = '';
  body.decisionMaker = decisionMaker.id;
  body.decisionMakerTitle = decisionMaker.title;
  body.decisionPersons = proposal.decision.decisionPersons.map(person => {
    const included: Record<string, unknown> = { ...person, included: true };
    delete included.notificationType;
    included.personIdAndName = `${person.personIdFormatted}, ${person.name}`;
    included.receivedDateIsInvalid = false;
    included.isValid = true;
    return included;
  });
  body.amount = input.amount ?? 0;
  body.coApplicant = NO_CO_APPLICANT;
  body.message = input.message ?? null;
  delete body.aktualiseringId;
  delete body.sharedCustody;
  delete body.whereDidChildGoType;
  delete body.guardianType;

  return { writable: true, body };
};
