/** "Från … – Till …" label for a date range; "Från …" when open-ended and "—" when there is no start. */
export const formatDateRange = (fromDate?: string, toDate?: string): string => {
  if (fromDate && toDate) {
    return `${fromDate} – ${toDate}`;
  }
  return fromDate ? `Från ${fromDate}` : '—';
};
