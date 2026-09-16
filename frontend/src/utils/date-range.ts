import { TFunction } from 'i18next';

/** "Från … – Till …" label for a date range; "Från …" (translated) when open-ended and "—" when there is no start. */
export const formatDateRange = (fromDate: string | undefined, toDate: string | undefined, t: TFunction): string => {
  if (fromDate && toDate) {
    return `${fromDate} – ${toDate}`;
  }
  return fromDate ? t('common:dateRange.from', { date: fromDate }) : '—';
};
