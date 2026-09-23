import { ApiResponse } from '@interfaces/api-service.interface';
import { LifecareDecisionReasonRaw, LifecareDecisionTypeRaw, LifecareSavedDecisionRaw } from '@interfaces/lifecare-decision.interface';
import { outcomeFor } from '@utils/lifecare-decision';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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

const asText = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

/** The registered beslut, cleaned up for the Beslut tab and finalize. The personnummer is left behind. */
export const toLifecareDecisionView = (saved: LifecareSavedDecisionRaw): LifecareDecisionView => ({
  id: saved.decisionId,
  decisionCode: saved.decisionCode,
  outcome: outcomeFor(saved.decisionType),
  date: asText(saved.date) ?? '',
  periodFrom: asText(saved.fromDate),
  periodTo: asText(saved.toDate),
  amount: typeof saved.amount === 'number' ? saved.amount : 0,
  // Lifecare sends 0 (or "") for no orsak.
  reasonCode: typeof saved.reasonCode === 'number' && saved.reasonCode > 0 ? saved.reasonCode : undefined,
  reason: asText(saved.reason),
  message: asText(saved.message),
  locked: saved.lockedMessage,
  decisionMaker: asText(saved.decisionMakerName) ?? asText(saved.decisionMaker) ?? '',
});

/** The active beslutstyper the insats offers, in Lifecare's order. */
export const toDecisionTypes = (types: LifecareDecisionTypeRaw[]): LifecareDecisionTypeView[] =>
  types
    .filter(type => type.isActive)
    .map(type => ({
      code: type.code,
      name: type.name,
      outcome: outcomeFor(type.type),
      requiresFromDate: type.requiresFromDate,
      requiresToDate: type.requiresToDate,
    }));

/** The choosable orsaker in Lifecare's catalogue — its leaves — each with the heading it sits under. */
export const toDecisionReasons = (catalogue: LifecareDecisionReasonRaw[], header = ''): LifecareDecisionReasonView[] =>
  catalogue.flatMap(node => {
    const nodeHeader = node.header || header;
    const own = node.reasonCode !== null ? [{ code: node.reasonCode, name: node.name, header: nodeHeader }] : [];
    return [...own, ...toDecisionReasons(node.options, node.reasonCode === null ? node.name : nodeHeader)];
  });
