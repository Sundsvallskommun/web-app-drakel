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
 * The month options offered in the utbetalning form's "Avser månad": the errand's ansökningsmånad and
 * the months just before it, newest first, as ISO year-months (yyyy-MM). Lifecare allows booking an
 * utbetalning on an earlier month than the application, but does not expose its own list through
 * caremanagement — so we offer a short window back from the errand's own month.
 */
export const applicationMonthOptions = (anchorMonth?: string, monthCount = 6): string[] => {
  const anchor = anchorMonth ? dayjs(anchorMonth) : dayjs();
  if (!anchor.isValid()) {
    return [];
  }
  return Array.from({ length: monthCount }, (_unused, monthsBack) =>
    anchor.subtract(monthsBack, 'month').format('YYYY-MM')
  );
};
