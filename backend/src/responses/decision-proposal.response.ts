import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * The beslutsförslag (decision proposal) behind the Beslut tab. caremanagement derives it on every read
 * from the calculation draft and the applicant's previous Lifecare decision — nothing is stored, so the
 * whole thing is read-only input to the form.
 */
export class PreviousDecisionView {
  @IsString() @IsOptional() type?: string;
  @IsString() @IsOptional() reason?: string;
  @IsString() @IsOptional() coApplicant?: string;
  @IsString() @IsOptional() coApplicantReason?: string;
  @IsString() @IsOptional() periodFrom?: string;
  @IsString() @IsOptional() periodTo?: string;
  @IsNumber() @IsOptional() amount?: number;
  @IsString() @IsOptional() date?: string;
}

/** A DECISION-section warning raised by the proposal; `typeDisplayName` is the label to show. */
export class DecisionProposalWarningView {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() type?: string;
  @IsString() @IsOptional() typeDisplayName?: string;
  @IsString() @IsOptional() message?: string;
  @IsString() @IsOptional() status?: string;
}

export class DecisionProposalView {
  /** BIFALL / DELAVSLAG / AVSLAG. */
  @IsString() @IsOptional() outcome?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() outcomeOptions?: string[];
  @IsString() @IsOptional() periodFrom?: string;
  @IsString() @IsOptional() periodTo?: string;
  @IsString() @IsOptional() concernedMonth?: string;
  /** normSum + expenseSum + specialExpenseSum − incomeSum. */
  @IsNumber() @IsOptional() estimatedAmount?: number;
  @IsNumber() @IsOptional() normSum?: number;
  @IsNumber() @IsOptional() incomeSum?: number;
  @IsNumber() @IsOptional() expenseSum?: number;
  @IsNumber() @IsOptional() specialExpenseSum?: number;
  /** Why the proposal is incomplete (Swedish); null when it is complete. */
  @IsString() @IsOptional() explanation?: string;
  /** The proposed orsak and Lifecare's catalogue — inputs to finalize, not to the plain decision POST. */
  @IsString() @IsOptional() reason?: string;
  /** The co-applicant's proposed orsak, from the same catalogue as the applicant's. */
  @IsString() @IsOptional() coApplicantReason?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() reasonOptions?: string[];
  @IsString() @IsOptional() phraseText?: string;
  @ValidateNested() @Type(() => PreviousDecisionView) @IsOptional() previousDecision?: PreviousDecisionView;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DecisionProposalWarningView)
  @IsOptional()
  warnings?: DecisionProposalWarningView[];
}

export class DecisionProposalApiResponse implements ApiResponse<DecisionProposalView> {
  @ValidateNested() @Type(() => DecisionProposalView) data!: DecisionProposalView;
  @IsString() message!: string;
}
