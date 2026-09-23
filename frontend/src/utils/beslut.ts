import { Decision } from '@services/beslut-service';
import { NormberakningDraft } from '@services/normberakning-service';
import dayjs from 'dayjs';

/**
 * The paid amount for a beslut: 0 for an avslag, otherwise the recommended amount from the
 * normberäkning. `outcome` is careM's outcome for the chosen Lifecare beslutstyp. Returns undefined when
 * there is no recommendation to go on.
 */
export const resolveBeslutAmount = (
  outcome: string | undefined,
  recommendedAmount: number | undefined
): number | undefined => (outcome === 'AVSLAG' ? 0 : recommendedAmount);

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
  fromDate: recommendation?.periodFrom ?? draft?.calculationFromDate ?? dayjs().startOf('month').format('YYYY-MM-DD'),
  toDate: recommendation?.periodTo ?? draft?.calculationToDate ?? dayjs().endOf('month').format('YYYY-MM-DD'),
});
