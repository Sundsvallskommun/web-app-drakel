/** A jobbstimulans period: from a day, to a day or — while it runs — open. */
interface DatedPeriod {
  fromDate?: string;
  toDate?: string;
}

/**
 * Whether the jobbstimulans period covers any day of the beräkning's period (`yyyy-MM-dd`) — then Lifecare
 * counts the sökandes lön down by jobbstimulans in the beräkning. Without a beräkning period, nothing is said.
 */
export const coversCalculationPeriod = (
  period: DatedPeriod,
  calculationFrom?: string,
  calculationTo?: string
): boolean =>
  !!period.fromDate &&
  !!calculationFrom &&
  !!calculationTo &&
  period.fromDate <= calculationTo &&
  (!period.toDate || period.toDate >= calculationFrom);
