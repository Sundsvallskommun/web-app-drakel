import { formatApplicationMonth } from '@utils/application-month';
import dayjs from 'dayjs';

/**
 * The placeholder characters a beslut phrase may carry, and what each is filled with: the sökandes name, the
 * beslut's belopp and its period. The belopp is `¥` (not `§`) so it never collides with "12 kap. 1 §".
 */
export const NAME_PLACEHOLDER = '¤';
export const AMOUNT_PLACEHOLDER = '¥';
export const PERIOD_PLACEHOLDER = '※';

/** What the errand says about the beslut, for filling a phrase. Anything missing leaves its placeholder. */
export interface BeslutPhraseValues {
  applicantName?: string;
  amount?: number;
  /** `YYYY-MM-DD`. */
  periodFrom?: string;
  /** `YYYY-MM-DD`. */
  periodTo?: string;
}

/** An amount as a beslut reads it: "3 000", "1 234,50" — Swedish grouping, decimals only when there are some. */
const formatPhraseAmount = (amount: number): string =>
  amount.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * The period as a beslut reads it: "september 2026" for one whole month, otherwise "2026-09-01 – 2026-09-15".
 * Undefined when either end is missing or not a date.
 */
export const formatPhrasePeriod = (periodFrom?: string, periodTo?: string): string | undefined => {
  const from = dayjs(periodFrom);
  const to = dayjs(periodTo);
  if (!periodFrom || !periodTo || !from.isValid() || !to.isValid()) {
    return undefined;
  }
  const wholeMonth = from.date() === 1 && to.isSame(from.endOf('month'), 'day');
  return wholeMonth ? formatApplicationMonth(periodFrom).toLowerCase() : `${periodFrom} – ${periodTo}`;
};

const replaceAll = (text: string, placeholder: string, value: string | undefined): string =>
  value === undefined || value === '' ? text : text.split(placeholder).join(value);

/**
 * Fills a beslut phrase from the errand: `¤` with the sökandes name, `¥` with the belopp and `※` with the
 * period. A value the errand does not have leaves its placeholder in the text, so the handläggare sees what
 * is still to be written.
 */
export const fillBeslutPhrase = (text: string, values: BeslutPhraseValues): string => {
  const withName = replaceAll(text, NAME_PLACEHOLDER, values.applicantName);
  const withAmount = replaceAll(
    withName,
    AMOUNT_PLACEHOLDER,
    values.amount === undefined ? undefined : formatPhraseAmount(values.amount)
  );
  return replaceAll(withAmount, PERIOD_PLACEHOLDER, formatPhrasePeriod(values.periodFrom, values.periodTo));
};
