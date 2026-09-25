import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import {
  LifecareDecisionReason as CaremanagementDecisionReason,
  LifecareDecisionType as CaremanagementDecisionType,
  LifecareDecisionView as CaremanagementDecisionView,
} from '@/data-contracts/caremanagement/data-contracts';

/** The errand's beslut as it stands in Lifecare — what the Beslut tab shows and finalize sends to careM. */
export class LifecareDecisionView {
  /** Lifecare's decisionId. */
  @IsNumber() id!: number;
  /** Lifecare's beslutstyp code. */
  @IsNumber() decisionCode!: number;
  /** careM's outcome for it, BIFALL or AVSLAG; left out for a beslutstyp Drakel does not register. */
  @IsString() @IsOptional() outcome?: string;
  /** The beslutsdatum, `yyyy-MM-dd`. */
  @IsString() date!: string;
  @IsString() @IsOptional() periodFrom?: string;
  @IsString() @IsOptional() periodTo?: string;
  @IsNumber() amount!: number;
  /** Lifecare's code for the orsak; left out when the beslut has none. */
  @IsNumber() @IsOptional() reasonCode?: number;
  /** The orsak as Lifecare words it. */
  @IsString() @IsOptional() reason?: string;
  /** The beslutsmeddelande as HTML. */
  @IsString() @IsOptional() message?: string;
  /** Lifecare has locked the beslutsmeddelande; the beslut can no longer be changed from Drakel. */
  @IsBoolean() locked!: boolean;
  @IsString() decisionMaker!: string;
}

export class LifecareDecisionApiResponse implements ApiResponse<LifecareDecisionView | null> {
  /** Null while no beslut has been saved in Lifecare for the errand. */
  @ValidateNested() @Type(() => LifecareDecisionView) @IsOptional() data!: LifecareDecisionView | null;
  @IsString() message!: string;
}

/** A beslutstyp the insats offers, as the Beslut tab lists it. */
export class LifecareDecisionTypeView {
  /** Lifecare's beslutstyp code. */
  @IsNumber() code!: number;
  @IsString() name!: string;
  /** careM's outcome for the type — BIFALL or AVSLAG; left out for a type Drakel does not register yet. */
  @IsString() @IsOptional() outcome?: string;
  @IsBoolean() requiresFromDate!: boolean;
  @IsBoolean() requiresToDate!: boolean;
}

export class LifecareDecisionTypesApiResponse implements ApiResponse<LifecareDecisionTypeView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareDecisionTypeView) data!: LifecareDecisionTypeView[];
  @IsString() message!: string;
}

/** An orsak a beslut of a type can carry, as Lifecare words it, under the heading it sits in. */
export class LifecareDecisionReasonView {
  /** Lifecare's reasonCode. */
  @IsNumber() code!: number;
  @IsString() name!: string;
  @IsString() header!: string;
}

export class LifecareDecisionReasonsApiResponse implements ApiResponse<LifecareDecisionReasonView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareDecisionReasonView) data!: LifecareDecisionReasonView[];
  @IsString() message!: string;
}

export class LifecareDecisionPdfApiResponse implements ApiResponse<string> {
  /** The beslut as Lifecare prints it, a PDF in base64. */
  @IsString() data!: string;
  @IsString() message!: string;
}

/*
 * careM answers with the same fields, but its contract leaves every one of them optional, even those careM always
 * fills (see careM's LifecareDecisionMapper) and the Beslut tab relies on. The mappers below keep the BFF's promise
 * by giving a missing one careM's own "none" value: an empty text, 0, or false.
 */

/** careM's beslut as the Beslut tab and finalize take it. */
export const toLifecareDecisionView = (decision: CaremanagementDecisionView): LifecareDecisionView => ({
  id: decision.id ?? 0,
  decisionCode: decision.decisionCode ?? 0,
  outcome: decision.outcome,
  date: decision.date ?? '',
  periodFrom: decision.periodFrom,
  periodTo: decision.periodTo,
  amount: decision.amount ?? 0,
  reasonCode: decision.reasonCode,
  reason: decision.reason,
  message: decision.message,
  locked: decision.locked ?? false,
  decisionMaker: decision.decisionMaker ?? '',
});

/** A beslutstyp from careM as the Beslut tab lists it. */
export const toDecisionTypeView = (type: CaremanagementDecisionType): LifecareDecisionTypeView => ({
  code: type.code ?? 0,
  name: type.name ?? '',
  outcome: type.outcome,
  requiresFromDate: type.requiresFromDate ?? false,
  requiresToDate: type.requiresToDate ?? false,
});

/** An orsak from careM as the Beslut tab lists it. */
export const toDecisionReasonView = (reason: CaremanagementDecisionReason): LifecareDecisionReasonView => ({
  code: reason.code ?? 0,
  name: reason.name ?? '',
  header: reason.header ?? '',
});
