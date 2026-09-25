import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import {
  NormberakningDraft as CaremanagementNormberakningDraft,
  NormberakningNormRow as CaremanagementNormberakningNormRow,
  NormberakningTypes as CaremanagementNormberakningTypes,
} from '@/data-contracts/caremanagement/data-contracts';

/**
 * The normberäkning draft mirrors the Lifecare FC "Beräkning" view: one income row per type (with an
 * applicant (S) and co-applicant (M) side), expenses split into EXPENSE / SPECIAL_EXPENSE buckets, the
 * covered persons, and a header (norm + dates + household size). Each value comes in three flavours:
 * a read-only process value (system), an editable handläggare value, and the resulting effective value.
 */
export class NormPersonRow {
  @IsString() @IsOptional() id?: string;
  /** Stable 0-based position within the section; rows keep this order across refreshes. */
  @IsInt() @IsOptional() position?: number;
  @IsString() @IsOptional() origin?: string;
  @IsString() @IsOptional() partyId?: string;
  /** Personnummer resolved from partyId via the Citizen API; best-effort, so it can be absent. */
  @IsString() @IsOptional() personalNumber?: string;
  /** The role as a machine code; `roleDisplayName` carries the label to show. */
  @IsString() @IsOptional() role?: string;
  /** caremanagement's own Swedish label for the role, e.g. "Medsökande". */
  @IsString() @IsOptional() roleDisplayName?: string;
  @IsString() @IsOptional() name?: string;
  @IsInt() @IsOptional() processDays?: number;
  @IsInt() @IsOptional() caseworkerDays?: number;
  @IsInt() @IsOptional() effectiveDays?: number;
  @IsBoolean() @IsOptional() included?: boolean;
  @IsString() @IsOptional() deviationFromDate?: string;
  @IsString() @IsOptional() deviationToDate?: string;
  @IsString() @IsOptional() normInterval?: string;
  /** The normintervall (norm row) the member is placed on, when the beräkning is Lifecare's. */
  @IsInt() @IsOptional() normRowId?: number;
  /** The member's own share of the norm — the Belopp column; carried over from the previous Lifecare calculation. */
  @IsNumber() @IsOptional() amount?: number;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

export class NormIncomeRow {
  @IsString() @IsOptional() id?: string;
  /** Stable 0-based position within the section; rows keep this order across refreshes. */
  @IsInt() @IsOptional() position?: number;
  @IsString() @IsOptional() origin?: string;
  @IsInt() @IsOptional() typeId?: number;
  @IsString() @IsOptional() typeName?: string;
  @IsNumber() @IsOptional() applicantProcessAmount?: number;
  @IsNumber() @IsOptional() applicantCaseworkerAmount?: number;
  @IsNumber() @IsOptional() applicantEffectiveAmount?: number;
  @IsString() @IsOptional() applicantAmountDate?: string;
  /**
   * Whether jobbstimulans applies to the sökandes side of this income: the handläggare's amount is then the
   * gross (Brutto S) and `applicantCountedAmount` what Lifecare counts (Belopp S).
   */
  @IsBoolean() @IsOptional() applicantJobStimulus?: boolean;
  /** The sökandes amount Lifecare counts once jobbstimulans is taken off — only on an income it applies to. */
  @IsNumber() @IsOptional() applicantCountedAmount?: number;
  @IsNumber() @IsOptional() coapplicantProcessAmount?: number;
  @IsNumber() @IsOptional() coapplicantCaseworkerAmount?: number;
  @IsNumber() @IsOptional() coapplicantEffectiveAmount?: number;
  @IsString() @IsOptional() coapplicantAmountDate?: string;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

export class NormExpenseRow {
  @IsString() @IsOptional() id?: string;
  /** Stable 0-based position within the section; rows keep this order across refreshes. */
  @IsInt() @IsOptional() position?: number;
  @IsString() @IsOptional() origin?: string;
  /** EXPENSE or SPECIAL_EXPENSE (set by the DMN). */
  @IsString() @IsOptional() bucket?: string;
  @IsString() @IsOptional() costType?: string;
  /** caremanagement's Lifecare label for the cost type — the same text a warning about the row uses. */
  @IsString() @IsOptional() costTypeDisplayName?: string;
  @IsString() @IsOptional() otherSubType?: string;
  @IsString() @IsOptional() specification?: string;
  @IsNumber() @IsOptional() appliedAmount?: number;
  @IsNumber() @IsOptional() processAmount?: number;
  @IsNumber() @IsOptional() caseworkerAmount?: number;
  @IsNumber() @IsOptional() effectiveAmount?: number;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

/** A normintervall of the norm, as Normintervall/Belopp offers it — e.g. "Ensamstående 3940.00". */
export class NormRowOption {
  @IsInt() id!: number;
  @IsString() name!: string;
}

export class NormberakningDraft {
  @IsString() @IsOptional() errandId?: string;
  @IsString() @IsOptional() applicationMonth?: string;
  @IsInt() @IsOptional() normId?: number;
  /** The selected norm types as machine codes; `normTypeDisplayNames` carries the labels. */
  @IsArray() @IsString({ each: true }) @IsOptional() normType?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() normTypeDisplayNames?: string[];
  @IsString() @IsOptional() calculationFromDate?: string;
  @IsString() @IsOptional() calculationToDate?: string;
  @IsString() @IsOptional() calculationDate?: string;
  @IsBoolean() @IsOptional() hasCustomHouseholdSize?: boolean;
  @IsInt() @IsOptional() householdSize?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormPersonRow) @IsOptional() persons?: NormPersonRow[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormIncomeRow) @IsOptional() incomes?: NormIncomeRow[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormExpenseRow) @IsOptional() expenses?: NormExpenseRow[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormExpenseRow) @IsOptional() specialExpenses?: NormExpenseRow[];
  @IsNumber() @IsOptional() incomeSum?: number;
  @IsNumber() @IsOptional() expenseSum?: number;
  @IsNumber() @IsOptional() specialExpenseSum?: number;
  @IsString() @IsOptional() created?: string;
  @IsString() @IsOptional() updated?: string;
  /**
   * Where the rows come from: careM's draft (CAREM) until the beräkning is first saved in Lifecare, and the
   * saved beräkning in Lifecare (LIFECARE) after that — then every change is made there directly.
   */
  @IsIn(['CAREM', 'LIFECARE']) @IsOptional() source?: 'CAREM' | 'LIFECARE';
  /** Whether Lifecare holds the beräkning as slutlig — no further change is possible. */
  @IsBoolean() @IsOptional() finalized?: boolean;
  /** The gemensamma kostnader of a household of the household size, before the members' share is taken — Lifecare's. */
  @IsNumber() @IsOptional() amountForHouseholdSize?: number;
  /** The members' share of the gemensamma kostnader (Summa) — Lifecare's. */
  @IsNumber() @IsOptional() commonHouseholdCost?: number;
  /** How many members the beräkning includes. */
  @IsInt() @IsOptional() familyMembers?: number;
  /** Whether the sökande has jobbstimulans in the period — the incomes then show a Brutto S column, as in Lifecare. */
  @IsBoolean() @IsOptional() applicantJobStimulus?: boolean;
  /** The norm's rows a member can be placed on — only for a beräkning in Lifecare. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormRowOption) @IsOptional() normRows?: NormRowOption[];
}

/** A selectable income or cost type: the code a row stores and the label shown. */
export class NormTypeOption {
  @IsString() @IsOptional() code?: string;
  @IsString() @IsOptional() displayName?: string;
}

/** The type catalogues the add-row dropdowns offer — Lifecare's own once the beräkning is saved there. */
export class NormberakningTypes {
  /** Lifecare's norms for the insats — the code is the normId. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormTypeOption) norms!: NormTypeOption[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormTypeOption) incomeTypes!: NormTypeOption[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormTypeOption) costTypes!: NormTypeOption[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormTypeOption) livingCostTypes!: NormTypeOption[];
}

export class NormberakningTypesApiResponse implements ApiResponse<NormberakningTypes> {
  @ValidateNested() @Type(() => NormberakningTypes) data!: NormberakningTypes;
  @IsString() message!: string;
}

export class NormberakningDraftApiResponse implements ApiResponse<NormberakningDraft> {
  @ValidateNested()
  @Type(() => NormberakningDraft)
  data!: NormberakningDraft;
  @IsString()
  message!: string;
}

/**
 * careM's normintervall as the Normintervall list's options. careM's contract marks the id and the name optional
 * where the option requires both; a row without them could not be chosen, so it is left out.
 */
const toNormRowOptions = (normRows: CaremanagementNormberakningNormRow[] | undefined): NormRowOption[] | undefined =>
  normRows?.flatMap(normRow => (normRow.id !== undefined && normRow.name !== undefined ? [{ id: normRow.id, name: normRow.name }] : []));

/** careM's Normberäkning rows as drakel's — the same fields; only the normintervall options need their id and name. */
export const toNormberakningDraft = (draft: CaremanagementNormberakningDraft): NormberakningDraft => ({
  ...draft,
  normRows: toNormRowOptions(draft.normRows),
});

/** careM's type catalogues as drakel's, where every catalogue is a list — empty when careM has none. */
export const toNormberakningTypes = (types: CaremanagementNormberakningTypes): NormberakningTypes => ({
  norms: types.norms ?? [],
  incomeTypes: types.incomeTypes ?? [],
  costTypes: types.costTypes ?? [],
  livingCostTypes: types.livingCostTypes ?? [],
});
