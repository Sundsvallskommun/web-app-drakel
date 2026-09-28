import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, ValidateNested } from 'class-validator';

/** One income to transfer from SSBTEK: which income type, for whom. The amount is always SSBTEK's, read by the BFF. */
export class SsbtekTransferIncomeDto {
  @IsIn(['APPLICANT', 'CO_APPLICANT'])
  role!: 'APPLICANT' | 'CO_APPLICANT';

  /** Lifecare's income type id, as careM's comparison gives it. */
  @IsInt()
  incomeTypeId!: number;
}

/** What makes two picked incomes the same one: the same income type for the same person. */
const incomeKey = (income: SsbtekTransferIncomeDto): string => `${income.role}:${income.incomeTypeId}`;

/** The incomes the handläggare picked to transfer from SSBTEK into the normberäkning. */
export class SsbtekTransferDto {
  // An income picked twice would be written into the normberäkning twice.
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique(incomeKey, { message: 'Samma inkomst kan bara överföras en gång.' })
  @ValidateNested({ each: true })
  @Type(() => SsbtekTransferIncomeDto)
  incomes!: SsbtekTransferIncomeDto[];
}
