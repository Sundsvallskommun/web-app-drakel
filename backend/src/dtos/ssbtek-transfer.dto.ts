import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, ValidateNested } from 'class-validator';

/** One income to transfer from SSBTEK: which income type, for whom. The amount is always SSBTEK's, read by the BFF. */
export class SsbtekTransferIncomeDto {
  @IsIn(['APPLICANT', 'CO_APPLICANT'])
  role!: 'APPLICANT' | 'CO_APPLICANT';

  /** Lifecare's income type id, as careM's comparison gives it. */
  @IsInt()
  incomeTypeId!: number;
}

/** The incomes the handläggare picked to transfer from SSBTEK into the normberäkning. */
export class SsbtekTransferDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SsbtekTransferIncomeDto)
  incomes!: SsbtekTransferIncomeDto[];
}
