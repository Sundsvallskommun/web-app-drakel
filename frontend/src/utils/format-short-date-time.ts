import dayjs from 'dayjs';
import localeSv from 'dayjs/locale/sv';

/**
 * Formats an ISO date-time compactly for record lists, e.g. "12 aug, 12:12" (or "12 Aug, 12:12" in English).
 * The year is added ("12 aug 2024, 12:12") when it isn't the current year, so older Lifecare records stay
 * unambiguous. Month names follow `language` (the UI language, 'sv' by default). Returns an empty string when
 * the value is missing or unparsable.
 */
export const formatShortDateTime = (dateTime?: string, language = 'sv'): string => {
  if (!dateTime) {
    return '';
  }
  const parsed = dayjs(dateTime);
  if (!parsed.isValid()) {
    return '';
  }
  const pattern = parsed.isSame(dayjs(), 'year') ? 'D MMM, HH:mm' : 'D MMM YYYY, HH:mm';
  // Locale passed explicitly so the month names don't depend on the global dayjs locale (English is built in).
  return parsed.locale(language === 'en' ? 'en' : localeSv).format(pattern);
};
