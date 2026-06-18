import { BeslutOption, Decision } from '@services/beslut-service';
import { NormberakningDraft } from '@services/normberakning-service';
import dayjs from 'dayjs';

/** An avslag is a beslutsalternativ that grants no belopp (carriesAmount === false). */
export const isAvslag = (option: BeslutOption | undefined): boolean => option?.carriesAmount === false;

/**
 * The paid amount for a beslut: 0 for an avslag, otherwise the recommended amount from the
 * normberäkning. Returns undefined when no decision is selected and no recommendation is available.
 */
export const resolveBeslutAmount = (
  option: BeslutOption | undefined,
  recommendedAmount: number | undefined
): number | undefined => {
  if (isAvslag(option)) {
    return 0;
  }
  return recommendedAmount;
};

/** The application period (Från/Till) a beslut concerns. */
export interface BeslutPeriod {
  fromDate: string;
  toDate: string;
}

/**
 * The period the beslut concerns, prefilled for the month the application covers. Prefers the
 * recommendation's period, then the normberäkning draft's calculation dates, and finally the current
 * calendar month.
 */
export const resolveBeslutPeriod = (
  recommendation: Decision | null | undefined,
  draft: NormberakningDraft | undefined
): BeslutPeriod => ({
  fromDate:
    recommendation?.periodFrom ?? draft?.calculationFromDate ?? dayjs().startOf('month').format('YYYY-MM-DD'),
  toDate: recommendation?.periodTo ?? draft?.calculationToDate ?? dayjs().endOf('month').format('YYYY-MM-DD'),
});
