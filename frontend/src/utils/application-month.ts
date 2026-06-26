import dayjs from 'dayjs';

// prettier-ignore
const SWEDISH_MONTHS = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
];

/** Formats an application month as e.g. "Juni 2026" — Swedish month name + year in digits. */
export const formatApplicationMonth = (value?: string): string => {
  if (!value) {
    return '—';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? `${SWEDISH_MONTHS[parsed.month()]} ${parsed.year()}` : value;
};
