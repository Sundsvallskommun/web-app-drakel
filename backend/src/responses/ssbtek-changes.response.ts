import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

const CHANGE_KINDS = ['ADD', 'CHANGE', 'GONE'] as const;
const INCOME_ROLES = ['APPLICANT', 'CO_APPLICANT'] as const;

export type SsbtekIncomeRole = (typeof INCOME_ROLES)[number];

/** One income on which SSBTEK and the normberäkning in Lifecare disagree, per income type and person. */
export class SsbtekIncomeChangeView {
  /** ADD: SSBTEK reports an income the normberäkning lacks; CHANGE: it has it at another amount; GONE: SSBTEK no longer reports it. */
  @IsIn(CHANGE_KINDS) kind!: (typeof CHANGE_KINDS)[number];
  /** Whose income: the sökande (Lifecare's S column) or the medsökande (M). */
  @IsIn(INCOME_ROLES) role!: SsbtekIncomeRole;
  /** Lifecare's income type id, when careM knows it. */
  @IsOptional() @IsInt() incomeTypeId?: number;
  /** Lifecare's income type name. */
  @IsString() incomeType!: string;
  /** The amount SSBTEK gives; left out for GONE. */
  @IsOptional() @IsNumber() ssbtekAmount?: number;
  /** The amount in the normberäkning; left out for ADD. */
  @IsOptional() @IsNumber() lifecareAmount?: number;
  /**
   * Whether it may be transferred into the normberäkning: only an income the normberäkning lacks (ADD), of a known
   * type, into a beräkning that is not slutlig. An income already there cannot be transferred again.
   */
  @IsBoolean() transferable!: boolean;
}

/** careM's comparison of SSBTEK with the errand's normberäkning in Lifecare — what can be transferred from SSBTEK. */
export class SsbtekChangesView {
  /**
   * Whether the comparison could be made: the normberäkning must be saved in Lifecare (and the errand not yet
   * decided). When false there is nothing to transfer yet.
   */
  @IsBoolean() available!: boolean;
  /** The normberäkning is slutlig in Lifecare and takes no change. */
  @IsBoolean() isFinal!: boolean;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SsbtekIncomeChangeView) changes!: SsbtekIncomeChangeView[];
}

export class SsbtekChangesApiResponse implements ApiResponse<SsbtekChangesView> {
  @ValidateNested() @Type(() => SsbtekChangesView) data!: SsbtekChangesView;
  @IsString() message!: string;
}
