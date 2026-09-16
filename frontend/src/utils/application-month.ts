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
