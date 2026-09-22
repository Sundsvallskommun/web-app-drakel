import { Payment } from '@services/payment-service';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ErrandUtbetalningList } from './errand-utbetalning-list.component';

const DRAFT: Payment = {
  id: 'p1',
  source: 'CASEWORKER',
  status: 'DRAFT',
  paymentDate: '2026-09-25',
  applicationMonth: '2026-09',
  amount: 8450,
  payeeName: 'Test Testsson',
  paymentMethod: 'Bankkonto',
};

const FROM_LIFECARE: Payment = {
  id: 'p2',
  source: 'LIFECARE',
  status: 'PENDING_REGISTRATION',
  paymentDate: '2026-08-27',
  applicationMonth: '2026-08',
  amount: 7900,
  payeeName: 'Hyresvärden AB',
  paymentMethod: 'Bankgiro',
};

describe('ErrandUtbetalningList', () => {
  it('lists payments newest first', () => {
    render(<ErrandUtbetalningList payments={[FROM_LIFECARE, DRAFT]} />);

    const dates = screen.getAllByRole('cell').map((cell) => cell.textContent);
    expect(dates.indexOf('2026-09-25')).toBeLessThan(dates.indexOf('2026-08-27'));
  });

  it('marks rows Draken did not author', () => {
    render(<ErrandUtbetalningList payments={[FROM_LIFECARE, DRAFT]} />);

    // Only the Lifecare-sourced row carries the badge.
    expect(screen.getAllByText('Från Lifecare')).toHaveLength(1);
  });

  it('translates the documented statuses', () => {
    render(<ErrandUtbetalningList payments={[DRAFT, FROM_LIFECARE]} />);

    expect(screen.getByText('Utkast')).toBeInTheDocument();
    expect(screen.getByText('Väntar på registrering')).toBeInTheDocument();
  });

  it('still names the statuses the corrected enum dropped', () => {
    // QUEUED, EFFECTUATED and FAILED were removed from the published enum, but a row written before that
    // would still carry one — and an unnamed status shows as a raw uppercase code.
    render(<ErrandUtbetalningList payments={[{ ...DRAFT, status: 'EFFECTUATED' }]} />);

    expect(screen.getByText('Verkställd')).toBeInTheDocument();
  });

  it('shows an unknown status as it came instead of hiding it', () => {
    // caremanagement can add a status before Draken knows about it — the row must stay readable.
    render(<ErrandUtbetalningList payments={[{ ...DRAFT, status: 'SOMETHING_NEW' }]} />);

    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();
  });

  it('says when nothing is registered yet', () => {
    render(<ErrandUtbetalningList payments={[]} />);

    expect(screen.getByText('Inga utbetalningar registrerade')).toBeInTheDocument();
  });
});
