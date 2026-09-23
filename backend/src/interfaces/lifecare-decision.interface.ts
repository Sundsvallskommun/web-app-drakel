/** A beslutstyp as Lifecare's `Decision/GetProposalForService` lists it, with the rules it carries. */
export interface LifecareDecisionTypeRaw {
  code: number;
  name: string;
  /** Lifecare's category for the type — 0 for a bifall, 10 for an avslag, 9 for återkrav … */
  type: number;
  isActive: boolean;
  requiresFromDate: boolean;
  requiresToDate: boolean;
}

/** A beslutsfattare Lifecare accepts — a handläggare's signature, a nämnd or a court. */
interface LifecareDecisionMakerRaw {
  id: string;
  name: string;
  title: string;
}

/**
 * A person the beslut concerns. The web app adds a few fields of its own before saving and drops
 * `notificationType` — see buildDecisionCreate. Carries the personnummer: never log it.
 */
interface LifecareDecisionPersonRaw {
  personId: string;
  name: string;
  coApplicant: boolean;
  personIdFormatted: string;
  [field: string]: unknown;
}

/** The blank beslut in the underlag — `Decision/Create` takes it back filled in. Only read fields are named. */
export interface LifecareDecisionRaw {
  decisionPersons: LifecareDecisionPersonRaw[];
  [field: string]: unknown;
}

/**
 * A beslut already registered in Lifecare, as `Decision/GetDecision` returns it — the object
 * `Decision/Update` takes back. Carries the personnummer: never log it.
 */
export interface LifecareSavedDecisionRaw extends LifecareDecisionRaw {
  decisionId: number;
  decisionCode: number;
  /** The category of its beslutstyp — the same as the type's own `type`. */
  decisionType: number;
  /** Set once the beslutsmeddelande is locked in Lifecare; the beslut can no longer be changed then. */
  lockedMessage: boolean;
  /** The beslutstyp with its rules; the web app sends it back with an empty `reasons` list. */
  type: Record<string, unknown> | null;
  message: string | null;
}

/**
 * Lifecare's underlag for a new beslut on an insats: the blank beslut and the lists it is filled from.
 * The only authority on which beslutstyper and beslutsfattare exist. Carries the personnummer: never log it.
 */
export interface LifecareDecisionProposalRaw {
  decision: LifecareDecisionRaw;
  decisionMakers: LifecareDecisionMakerRaw[];
  decisionTypes: LifecareDecisionTypeRaw[];
}

/**
 * One node of Lifecare's orsak catalogue for a beslutstyp (`GetMappedDecisionReasons`). Headings carry
 * `reasonCode: null` and their choosable orsaker in `options`; only those leaves can go on a beslut.
 */
export interface LifecareDecisionReasonRaw {
  header: string;
  /** The orsak as Lifecare words it, e.g. "Föräldrapenning otillräcklig" — the same text careM keeps. */
  name: string;
  reasonCode: number | null;
  options: LifecareDecisionReasonRaw[];
}

/** The beslut `Decision/Create` answers with. Its id is `decisionId`. */
export interface LifecareCreatedDecisionRaw {
  decisionId: number;
  [field: string]: unknown;
}
