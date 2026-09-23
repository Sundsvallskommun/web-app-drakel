import { PaymentRegistrationOutcomeEnum } from '@data-contracts/backend/data-contracts';
import { Payment, registerPaymentInLifecare } from '@services/payment-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ErrandUtbetalningList } from './errand-utbetalning-list.component';

vi.mock('@services/payment-service', () => ({ registerPaymentInLifecare: vi.fn() }));

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
    render(<ErrandUtbetalningList errandId="errand-1" onPaymentsChanged={vi.fn()} payments={[FROM_LIFECARE, DRAFT]} />);

    const dates = screen.getAllByRole('cell').map((cell) => cell.textContent);
    expect(dates.indexOf('2026-09-25')).toBeLessThan(dates.indexOf('2026-08-27'));
  });

  it('marks rows Draken did not author', () => {
    render(<ErrandUtbetalningList errandId="errand-1" onPaymentsChanged={vi.fn()} payments={[FROM_LIFECARE, DRAFT]} />);

    // Only the Lifecare-sourced row carries the badge.
    expect(screen.getAllByText('Från Lifecare')).toHaveLength(1);
  });

  it('translates the documented statuses', () => {
    render(<ErrandUtbetalningList errandId="errand-1" onPaymentsChanged={vi.fn()} payments={[DRAFT, FROM_LIFECARE]} />);

    expect(screen.getByText('Utkast')).toBeInTheDocument();
    expect(screen.getByText('Väntar på registrering')).toBeInTheDocument();
  });

  it('names an utbetalning the robot got into Lifecare without calling it paid out', () => {
    // REGISTERED means it exists in Lifecare; whether it was effectuated is a separate question, so the
    // label must not read as "Verkställd".
    render(
      <ErrandUtbetalningList
        errandId="errand-1"
        onPaymentsChanged={vi.fn()}
        payments={[{ ...DRAFT, status: 'REGISTERED' }]}
      />
    );

    expect(screen.getByText('Registrerad i Lifecare')).toBeInTheDocument();
  });

  it('shows Lifecare’s own reason when the robot could not register the utbetalning', () => {
    render(
      <ErrandUtbetalningList
        errandId="errand-1"
        onPaymentsChanged={vi.fn()}
        payments={[{ ...DRAFT, status: 'FAILED', lifecareDetail: 'Kontot är spärrat i Lifecare' }]}
      />
    );

    expect(screen.getByText('Misslyckades')).toBeInTheDocument();
    expect(screen.getByText('Kontot är spärrat i Lifecare')).toBeInTheDocument();
  });

  it('still names the statuses the corrected enum dropped', () => {
    // QUEUED, EFFECTUATED and FAILED were removed from the published enum, but a row written before that
    // would still carry one — and an unnamed status shows as a raw uppercase code.
    render(
      <ErrandUtbetalningList
        errandId="errand-1"
        onPaymentsChanged={vi.fn()}
        payments={[{ ...DRAFT, status: 'EFFECTUATED' }]}
      />
    );

    expect(screen.getByText('Verkställd')).toBeInTheDocument();
  });

  it('shows an unknown status as it came instead of hiding it', () => {
    // caremanagement can add a status before Draken knows about it — the row must stay readable.
    render(
      <ErrandUtbetalningList
        errandId="errand-1"
        onPaymentsChanged={vi.fn()}
        payments={[{ ...DRAFT, status: 'SOMETHING_NEW' }]}
      />
    );

    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();
  });

  it('says when nothing is registered yet', () => {
    render(<ErrandUtbetalningList errandId="errand-1" onPaymentsChanged={vi.fn()} payments={[]} />);

    expect(screen.getByText('Inga utbetalningar registrerade')).toBeInTheDocument();
  });

  it('registers a waiting utbetalning in Lifecare and shows why when it is held back', async () => {
    vi.mocked(registerPaymentInLifecare).mockResolvedValue({
      data: {
        paymentId: 'p2',
        outcome: PaymentRegistrationOutcomeEnum.NOT_SENT,
        detail: 'Saldot i Lifecare räcker inte.',
      },
    });
    const onPaymentsChanged = vi.fn();
    render(
      <ErrandUtbetalningList
        errandId="errand-1"
        onPaymentsChanged={onPaymentsChanged}
        payments={[FROM_LIFECARE, DRAFT]}
      />
    );

    // Only the row still waiting for Lifecare offers it.
    fireEvent.click(screen.getByRole('button', { name: 'Registrera i Lifecare' }));

    await waitFor(() => {
      expect(screen.getByText('Saldot i Lifecare räcker inte.')).toBeInTheDocument();
    });
    expect(registerPaymentInLifecare).toHaveBeenCalledWith('errand-1', 'p2');
    expect(onPaymentsChanged).not.toHaveBeenCalled();
  });
});
