import dayjs from 'dayjs';
import localeSv from 'dayjs/locale/sv';

/**
 * Formats an ISO date-time compactly for record lists, e.g. "12 aug, 12:12". The year is added
 * ("12 aug 2024, 12:12") when it isn't the current year, so older Lifecare records stay unambiguous.
 * Returns an empty string when the value is missing or unparsable.
 */
export const formatShortDateTime = (dateTime?: string): string => {
  if (!dateTime) {
    return '';
  }
  const parsed = dayjs(dateTime);
  if (!parsed.isValid()) {
    return '';
  }
  const pattern = parsed.isSame(dayjs(), 'year') ? 'D MMM, HH:mm' : 'D MMM YYYY, HH:mm';
  // Locale passed explicitly so the Swedish month names don't depend on the global dayjs locale.
  return parsed.locale(localeSv).format(pattern);
};
