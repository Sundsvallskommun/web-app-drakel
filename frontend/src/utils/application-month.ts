import dayjs from 'dayjs';

// prettier-ignore
const SWEDISH_MONTHS = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
];

/**
 * Formats an application month as e.g. "Juni 2026" — month name + year in digits. Swedish by default (the
 * normberäkning PDF relies on that); pass `'en'` for the English UI ("June 2026").
 */
export const formatApplicationMonth = (value?: string, language = 'sv'): string => {
  if (!value) {
    return '—';
  }
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return value;
  }
  return language === 'en' ?
      parsed.locale('en').format('MMMM YYYY')
    : `${SWEDISH_MONTHS[parsed.month()]} ${parsed.year()}`;
};

/**
 * The application period the citizen gave as a month number (1–12) and a year, formatted as formatApplicationMonth
 * does, e.g. "Januari 2026" / "January 2026". Empty when either part is missing or out of range.
 */
export const formatPeriodMonth = (month: number | undefined, year: number | undefined, language: string): string =>
  month && year && month >= 1 && month <= 12 ?
    formatApplicationMonth(`${String(year)}-${String(month).padStart(2, '0')}-01`, language)
  : '';
