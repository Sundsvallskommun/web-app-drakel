const SWEDISH_DATE = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' });

/**
 * Today's date in Sweden as `YYYY-MM-DD` — the date a handläggare sees on their calendar, whatever time
 * zone the server runs in. Comparable as a string with Lifecare's own `YYYY-MM-DD` dates.
 */
export const swedishToday = (): string => SWEDISH_DATE.format(new Date());
