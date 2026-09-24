import { SsbtekPayment } from '@data-contracts/backend/data-contracts';
import { describe, expect, it } from 'vitest';

import { groupByPaymentMonth } from './ssbtek-payment-months';

const payment = (benefit: string, dates: Partial<SsbtekPayment>): SsbtekPayment => ({
  source: 'FK',
  benefit,
  preliminary: false,
  parts: [],
  ...dates,
});

describe('groupByPaymentMonth', () => {
  it('groups the payments by the month they were paid, keeping their order', () => {
    const months = groupByPaymentMonth([
      payment('Bostadsbidrag', { paidOn: '2026-09-25' }),
      payment('Barnbidrag', { paidOn: '2026-09-20' }),
      payment('Bostadsbidrag', { paidOn: '2026-08-25' }),
    ]);

    expect(months.map(({ month, payments }) => [month, payments.map(({ benefit }) => benefit)])).toEqual([
      ['2026-09', ['Bostadsbidrag', 'Barnbidrag']],
      ['2026-08', ['Bostadsbidrag']],
    ]);
  });

  it("uses the period's month when the agency gives no betalningsdag, and no month when there is no date at all", () => {
    const months = groupByPaymentMonth([
      payment('Arbetslöshetsersättning', { periodFrom: '2026-07-03', periodTo: '2026-07-16' }),
      payment('Okänd', {}),
    ]);

    expect(months.map(({ month }) => month)).toEqual(['2026-07', undefined]);
  });
});
