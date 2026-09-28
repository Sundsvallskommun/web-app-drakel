import dayjs from 'dayjs';

/**
 * caremanagement stores the documented moment ("Datum"/"Tid" in Lifecare) as a single ISO offset
 * date-time, e.g. 2025-05-30T14:30:00+02:00, while the UI keeps a separate date and time picker.
 * These helpers convert between the two shapes.
 */
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ';

/** Midnight, used when the handläggare leaves the optional time picker empty. */
const START_OF_DAY = '00:00';

/** Combines a yyyy-MM-dd date and an optional HH:mm time into one ISO offset date-time. */
export const combineDateAndTime = (date: string, time?: string): string =>
  dayjs(`${date}T${time && time !== '' ? time : START_OF_DAY}`).format(ISO_OFFSET_FORMAT);

/**
 * The last second of a yyyy-MM-dd date as an ISO offset date-time (23:59:59), for an upper bound that is meant to
 * include the whole day. Second precision, in the same format as every other date-time sent.
 */
export const endOfDayDateTime = (date: string): string => dayjs(date).endOf('day').format(ISO_OFFSET_FORMAT);

/** Splits an ISO offset date-time into the yyyy-MM-dd and HH:mm parts the pickers bind to. */
export const splitDateTime = (dateTime?: string): { date: string; time: string } => {
  if (!dateTime) {
    return { date: '', time: '' };
  }
  const parsed = dayjs(dateTime);
  return parsed.isValid() ?
      { date: parsed.format('YYYY-MM-DD'), time: parsed.format('HH:mm') }
    : { date: '', time: '' };
};

/**
 * Formats a date-time for display as "YYYY-MM-DD HH:mm" — or with another `separator` between date and time, e.g.
 * ", " for "YYYY-MM-DD, HH:mm". Empty string when missing or unparsable.
 */
export const formatDateTime = (dateTime?: string | Date, separator = ' '): string => {
  if (!dateTime) {
    return '';
  }
  const parsed = dayjs(dateTime);
  return parsed.isValid() ? parsed.format(`YYYY-MM-DD[${separator}]HH:mm`) : '';
};
