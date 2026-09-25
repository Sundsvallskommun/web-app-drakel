import dayjs, { Dayjs } from 'dayjs';

/** The months an SSBTEK lookup covers, `YYYY-MM`, as the handläggare picks them. */
export interface SsbtekMonths {
  fromMonth: string;
  toMonth: string;
}

/** The period careM reads SSBTEK for: inclusive dates, `YYYY-MM-DD`. */
export interface SsbtekPeriod {
  from: string;
  to: string;
}

const MONTH_FORMAT = 'YYYY-MM';

/** The months the SSBTEK rules look at by default: the jämförelseperiod, month M−2, through the current month M. */
export const defaultSsbtekMonths = (today: Dayjs = dayjs()): SsbtekMonths => ({
  fromMonth: today.subtract(2, 'month').format(MONTH_FORMAT),
  toMonth: today.format(MONTH_FORMAT),
});

/** The months to pick from, newest first: the current month and the `count − 1` before it. */
export const recentMonths = (count: number, today: Dayjs = dayjs()): string[] =>
  Array.from({ length: count }, (_, monthsBack) => today.subtract(monthsBack, 'month').format(MONTH_FORMAT));

/** Whole months as the dates careM takes — the earlier month first, whichever way round they were picked. */
export const periodOfMonths = ({ fromMonth, toMonth }: SsbtekMonths): SsbtekPeriod => {
  const [first, last] = fromMonth <= toMonth ? [fromMonth, toMonth] : [toMonth, fromMonth];
  return { from: `${first}-01`, to: dayjs(`${last}-01`).endOf('month').format('YYYY-MM-DD') };
};
