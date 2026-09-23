import { LifecareDecisionProposalRaw, LifecareDecisionRaw, LifecareSavedDecisionRaw } from '@interfaces/lifecare-decision.interface';

/**
 * careM's outcome for each Lifecare beslutstyp category Drakel registers — finalize needs the outcome.
 * Every bifall type (category 0) and every avslag type (category 10) the insats offers can be saved, e.g.
 * both 12 kap 1, 7 §§ and 12 kap 2 § SoL. Other categories (återkrav, förskott …) are listed but stopped,
 * since what else they set in motion in Lifecare (insatser, återkrav, balances) is not captured.
 *
 * TODO: Lifecare's beslutstyper are not fully configured for ekonomiskt bistånd yet. Revisit this mapping —
 * and which categories Drakel lets through — once they are, and verify the categories against the final setup.
 */
const OUTCOME_BY_CATEGORY: Partial<Record<number, string>> = {
  0: 'BIFALL',
  10: 'AVSLAG',
};

/** What the web app sends as `coApplicant` when the household has no medsökande. */
const NO_CO_APPLICANT = 'NOONE';

/** The beslut to register, as the handläggare decided it on the Beslut tab. */
export interface LifecareDecisionInput {
  /** Lifecare's beslutstyp code, e.g. 153 for bifall under 12 kap 1, 7 §§ SoL. */
  decisionCode: number;
  periodFrom?: string;
  periodTo?: string;
  amount?: number;
  /** The orsak's code in Lifecare's catalogue; sent empty when the beslut has none. */
  reasonCode?: number;
  /** The beslutsmeddelande as HTML. */
  message?: string;
  /** The beslutsfattare's signature — the handläggare's own account. */
  decisionMakerId: string;
  /** The beslutsdatum; Lifecare's own proposal (today) when left out. */
  date?: string;
}

/** Either the `Decision/Create` body, or why the beslut cannot be registered as it stands. */
export type DecisionCreate = { writable: true; body: Record<string, unknown> } | { writable: false; reason: string };

const refuse = (reason: string): DecisionCreate => ({ writable: false, reason });

/** A careM date (possibly with a time) as Lifecare's `yyyy-MM-dd`; an empty string when there is none. */
const toLifecareDate = (value: string | undefined): string => (value ?? '').slice(0, 10);

/** careM's outcome for a Lifecare beslutstyp category; undefined for a category Drakel does not register. */
export const outcomeFor = (category: number): string | undefined => OUTCOME_BY_CATEGORY[category];

/**
 * Fills a Lifecare beslut object with the handläggare's choices the way Lifecare's web app does — for a
 * new beslut the underlag's blank one, for a change the registered one. Each field keeps its place in the
 * object; beslutstyp, period, orsak, belopp, beslutsfattare and meddelande are filled in, every person is
 * marked as included, and the fields the web app adds and drops are treated as it treats them.
 *
 * A wrong beslut is accepted by Lifecare without complaint, so anything that cannot be decided safely is
 * refused instead of sent:
 * - a beslutstyp whose category Drakel does not register yet (see OUTCOME_BY_CATEGORY);
 * - "Delvis bifall", which has no settled registration in Lifecare yet;
 * - a household with a medsökande — sending "NOONE" for one is accepted and silently leaves them out of
 *   the beslut, and how a medsökande is registered is not captured yet;
 * - a beslutsfattare Lifecare does not know — the beslut must name the handläggare, never fall back on
 *   the service account;
 * - a period the beslutstyp requires but the beslut lacks.
 */
const fillDecision = (base: LifecareDecisionRaw, proposal: LifecareDecisionProposalRaw, input: LifecareDecisionInput): DecisionCreate => {
  const decisionType = proposal.decisionTypes.find(candidate => candidate.code === input.decisionCode && candidate.isActive);
  if (!decisionType) {
    return refuse(`Beslutstypen ${String(input.decisionCode)} finns inte på insatsen i Lifecare.`);
  }
  if (outcomeFor(decisionType.type) === undefined) {
    return refuse(`Beslutstypen "${decisionType.name}" kan inte registreras från Drakel ännu. Registrera beslutet direkt i Lifecare.`);
  }

  if (base.decisionPersons.some(person => person.coApplicant)) {
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

  // Assigning onto a copy keeps each field where Lifecare had it; the web app's own additions go last.
  const body: Record<string, unknown> = { ...base };
  body.decisionCode = decisionType.code;
  if (input.date) {
    body.date = toLifecareDate(input.date);
  }
  body.fromDate = fromDate;
  body.toDate = toDate;
  body.reasonCode = input.reasonCode ?? '';
  body.reasonCodeCoApplicant = '';
  body.decisionMaker = decisionMaker.id;
  // A registered beslut names its beslutsfattare; a blank one leaves the name to Lifecare.
  if (typeof base.decisionMakerName === 'string') {
    body.decisionMakerName = decisionMaker.name;
  }
  body.decisionMakerTitle = decisionMaker.title;
  body.decisionPersons = base.decisionPersons.map(person => {
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
  delete body.whereDidChildGoType;
  delete body.guardianType;

  return { writable: true, body };
};

/** The `Decision/Create` body for a new beslut on the insats (capture 2026-09-23). */
export const buildDecisionCreate = (proposal: LifecareDecisionProposalRaw, input: LifecareDecisionInput): DecisionCreate => {
  const filled = fillDecision(proposal.decision, proposal, input);
  if (filled.writable) {
    // Only a new beslut goes without it; the web app keeps it on a change.
    delete filled.body.sharedCustody;
  }
  return filled;
};

/**
 * The `Decision/Update` body for a beslut already registered in Lifecare (capture 2026-09-23): the beslut
 * as `GetDecision` returned it, filled in as for a new one, with the beslutstyp sent back carrying an
 * empty `reasons` list as the web app sends it. The underlag supplies the beslutstyper and beslutsfattare.
 *
 * Refused as well: a beslut whose meddelande Lifecare has locked, and a change of beslutstyp — how the
 * web app changes the type of a registered beslut is not captured, and a wrong type is accepted silently.
 */
export const buildDecisionUpdate = (
  saved: LifecareSavedDecisionRaw,
  proposal: LifecareDecisionProposalRaw,
  input: LifecareDecisionInput,
): DecisionCreate => {
  if (saved.lockedMessage) {
    return refuse('Beslutet är låst i Lifecare och kan inte ändras från Drakel.');
  }
  if (saved.decisionCode !== input.decisionCode) {
    return refuse('Beslutstypen kan inte ändras på ett beslut som redan finns i Lifecare. Ändra beslutet direkt i Lifecare.');
  }
  const filled = fillDecision(saved, proposal, input);
  if (filled.writable && saved.type) {
    filled.body.type = { ...saved.type, reasons: [] };
  }
  return filled;
};
