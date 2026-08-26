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

/** Formats an ISO date-time for display as "YYYY-MM-DD HH:mm"; empty string when missing or unparsable. */
export const formatDateTime = (dateTime?: string): string => {
  if (!dateTime) {
    return '';
  }
  const parsed = dayjs(dateTime);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '';
};
