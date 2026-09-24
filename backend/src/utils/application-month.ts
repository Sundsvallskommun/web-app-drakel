import { FinancialAssistanceData } from '@/data-contracts/caremanagement/data-contracts';

/** The errand's ansökningsmånad as `yyyy-MM`, or undefined when careM has no period for it. */
export const applicationMonthOf = (data: FinancialAssistanceData | undefined): string | undefined => {
  const month = data?.periodMonth;
  const year = data?.periodYear;
  return month && year ? `${String(year)}-${String(month).padStart(2, '0')}` : undefined;
};
