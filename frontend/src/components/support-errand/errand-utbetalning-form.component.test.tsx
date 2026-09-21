import { getErrandStakeholders } from '@services/errand-service/errand-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandUtbetalningForm } from './errand-utbetalning-form.component';

vi.mock('@services/errand-service/errand-service', () => ({
  getErrandStakeholders: vi.fn(),
}));

const APPLICANT = {
  id: 'stakeholder-1',
  personalNumber: '880209-T050',
  firstName: 'Test',
  lastName: 'Testsson',
  address: 'Storgatan 1',
  careOf: 'c/o Testsson',
  zipCode: '851 85',
  city: 'Sundsvall',
};

describe('ErrandUtbetalningForm', () => {
  beforeEach(() => {
    vi.mocked(getErrandStakeholders).mockReset();
    vi.mocked(getErrandStakeholders).mockResolvedValue({ data: [APPLICANT] });
  });

  it('opens the bank-account fields only once Bankkonto is the chosen betalsätt', async () => {
    render(<ErrandUtbetalningForm errandId="errand-1" applicationMonth="2026-09" />);

    expect(screen.getByLabelText(/^Clearing/)).toBeDisabled();
    expect(screen.getByLabelText(/^Kontonummer/)).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Betalsätt/), { target: { value: 'BANK_ACCOUNT' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Clearing/)).toBeEnabled();
    });
    expect(screen.getByLabelText(/^Kontonummer/)).toBeEnabled();
    // The postal-address fields belong to another betalsätt, so they stay closed.
    expect(screen.getByLabelText(/^C\/O adress/)).toBeDisabled();
  });

  it('opens the postal-address fields for Utbetalningskort', async () => {
    render(<ErrandUtbetalningForm errandId="errand-1" applicationMonth="2026-09" />);

    fireEvent.change(screen.getByLabelText(/^Betalsätt/), { target: { value: 'PAYMENT_CARD' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/^C\/O adress/)).toBeEnabled();
    });
    expect(screen.getByLabelText(/^Postnummer/)).toBeEnabled();
    expect(screen.getByLabelText(/^Ort/)).toBeEnabled();
    expect(screen.getByLabelText(/^Clearing/)).toBeDisabled();
  });

  it('prefills name and address from the chosen betalningsmottagare', async () => {
    render(<ErrandUtbetalningForm errandId="errand-1" applicationMonth="2026-09" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^Betalningsmottagare/)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/^Betalningsmottagare/), { target: { value: 'stakeholder-1' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Namn/)).toHaveValue('880209-T050 Testsson, Test');
    });
    expect(screen.getByLabelText(/^Adress/)).toHaveValue('Storgatan 1');
    expect(screen.getByLabelText(/^Ort/)).toHaveValue('Sundsvall');
  });

  it('adds a message line for each click on the add button', async () => {
    render(<ErrandUtbetalningForm errandId="errand-1" applicationMonth="2026-09" />);

    const addButton = screen.getByRole('button', { name: 'Lägg till meddelanderad' });
    expect(screen.getAllByRole('textbox', { name: /^Meddelanderad \d/ })).toHaveLength(1);

    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getAllByRole('textbox', { name: /^Meddelanderad \d/ })).toHaveLength(2);
    });
    // Each row is announced separately, not as a repeat of the group heading.
    expect(screen.getByLabelText('Meddelanderad 2')).toBeInTheDocument();
  });
});
