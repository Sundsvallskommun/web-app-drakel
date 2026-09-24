/**
 * Lifecare's normberäkning objects (`Calculation/*`, captures 2026-09-24). Only the fields drakel reads or
 * writes are named; the rest rides along untouched, since Lifecare's create and update take its own whole
 * object back. Persons carry the personnummer: never log them.
 */

/** A household member on a beräkning. `normRowId` is left out on a member the web app never placed. */
export interface LifecareCalculationPersonRaw {
  personId: string;
  name: string;
  normRowId?: number;
  normRow: string | null;
  amount: number;
  included: boolean;
  deviationFromDate: string;
  deviationToDate: string;
  personIdFormatted: string;
  [field: string]: unknown;
}

/** An income row: the sökandes and the medsökandes amount of one income type. */
export interface LifecareCalculationIncomeRaw {
  incomeCode: number;
  incomeType: string;
  amountApplicant: number;
  amountCoApplicant: number;
  /** The date the sökandes amount was looked up (SSBTEK), `yyyy-MM-dd` or empty. */
  applicantSearchDate?: string;
  coApplicantSearchDate?: string;
  [field: string]: unknown;
}

/** An utgift or a levnadskostnad i övrigt: what was applied for and what is approved. */
export interface LifecareCalculationExpenseRaw {
  expenseCode: number;
  expenseType: string;
  appliedAmount: number;
  approvedAmount: number;
  note: string | null;
  [field: string]: unknown;
}

/** Lifecare's own summering of a saved beräkning. Norm and utgifter come negative, as Lifecare shows them. */
interface LifecareCalculationSummaryRaw {
  income: number;
  jobStimulus: number;
  jobStimulusDeduction: number;
  norm: number;
  expences: number;
  sum: number;
  specialPurpose: number;
  balance: number;
  deficitSum: number;
  commonHouseholdCost: number;
  familyCost: number;
}

interface LifecareNormRaw {
  normId: number;
  name: string;
  [field: string]: unknown;
}

export interface LifecareCalculationRaw {
  calculationId: number;
  normId: number;
  normText: string | null;
  date: string;
  startDate: string;
  endDate: string;
  calculationSummary: LifecareCalculationSummaryRaw | null;
  calculationPersons: LifecareCalculationPersonRaw[];
  calculationIncomes: LifecareCalculationIncomeRaw[];
  calculationExpenses: LifecareCalculationExpenseRaw[];
  calculationSpecialExpenses: LifecareCalculationExpenseRaw[];
  hasCustomHouseholdSize: boolean;
  isFinalized: boolean;
  updateTimestamp: string;
  /** Lifecare's own sums, all positive: inkomster, utgifter, levnadskostnader i övrigt, norm and total. */
  sumInk?: number;
  sumUtg?: number;
  sumSpec?: number;
  sumNorm?: number;
  totSum?: number;
  commonHouseholdCost?: number;
  [field: string]: unknown;
}

/** An income or expense type in Lifecare's catalogue. */
export interface LifecareCalculationTypeRaw {
  id: number;
  text: string;
  isActive: boolean;
  /** An income jobbstimulans applies to, e.g. "Lön efter skatt". */
  isJobStimulus?: boolean;
  /** The share of such an income jobbstimulans leaves out, e.g. 25. */
  jobStimulusPercent?: number;
  [field: string]: unknown;
}

/** The catalogues a beräkning is filled from — carried by the underlag and by a beräkning read for edit. */
export interface LifecareCalculationCataloguesRaw {
  norms: LifecareNormRaw[];
  incomeTypes: LifecareCalculationTypeRaw[];
  expenseTypes: LifecareCalculationTypeRaw[];
  specialExpenseTypes: LifecareCalculationTypeRaw[];
}

/** `Calculation/GetProposalService`: a blank beräkning for the insats, the household on it, and the catalogues. */
export interface LifecareCalculationProposalRaw extends LifecareCalculationCataloguesRaw {
  calculation: LifecareCalculationRaw;
}

/** `Calculation/GetCalculationForEdit`: a saved beräkning in the shape `Calculation/Update` takes back. */
export interface LifecareCalculationForEditRaw extends LifecareCalculationCataloguesRaw {
  calculation: LifecareCalculationRaw;
}

/** `Calculation/PlacePersons`: the norm with its rows, and each member placed on a row with its amount. */
export interface LifecarePlacedPersonsRaw {
  calculationPersons: LifecareCalculationPersonRaw[];
  [field: string]: unknown;
}
