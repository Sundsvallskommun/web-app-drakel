import { LifecarePayeeView } from '@data-contracts/backend/data-contracts';
import { getErrandStakeholders } from '@services/errand-service/errand-service';
import { getLifecarePaymentOptions } from '@services/lifecare-payment-service';
import { createPayment, PaymentProposal } from '@services/payment-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandUtbetalningForm } from './errand-utbetalning-form.component';

vi.mock('@services/errand-service/errand-service', () => ({
  getErrandStakeholders: vi.fn(),
}));

vi.mock('@services/payment-service', () => ({
  createPayment: vi.fn(),
}));

vi.mock('@services/lifecare-payment-service', () => ({
  getLifecarePaymentOptions: vi.fn(),
  createLifecarePayee: vi.fn(),
}));

const APPLICANT = {
  id: 'stakeholder-1',
  personalNumber: '880209-T050',
  firstName: 'Test',
  lastName: 'Testsson',
};

// The payee as careM's utbetalningsförslag names it: no id, just the account.
const BANK_ACCOUNT_PAYEE = {
  name: 'Test Testsson',
  paymentMethod: 'Personkonto',
  clearing: '8327',
  accountNumber: '1234567',
};
const GIRO_PAYEE = { name: 'Hyresvärden AB', paymentMethod: 'Plusgiro', accountNumber: '5051-6905' };

/** A payee as Lifecare lists it for the insats. */
const lifecarePayee = (
  id: number,
  payee: { name: string; paymentMethod: string; clearing?: string; accountNumber: string }
): LifecarePayeeView => ({
  id,
  label: payee.name,
  name: payee.name,
  paymentMethodCode: 0,
  paymentMethod: payee.paymentMethod,
  clearing: payee.clearing ?? '',
  accountNumber: payee.accountNumber,
  streetAddress: '',
  careOfAddress: '',
  postalCode: '',
  postalAddress: 'Sundsvall',
  toRegisteredAddress: false,
});

const LIFECARE_OPTIONS = {
  paymentMethods: [
    { code: 5, name: 'Personkonto', localNumberEnabled: false, localNumberMandatory: false },
    { code: 4, name: 'Plusgiro', localNumberEnabled: true, localNumberMandatory: false },
    { code: 14, name: 'Bankgiro via Plusgiro', localNumberEnabled: false, localNumberMandatory: false },
  ],
  payees: [lifecarePayee(11, BANK_ACCOUNT_PAYEE), lifecarePayee(12, GIRO_PAYEE)],
};

const PROPOSAL: PaymentProposal = {
  payments: [{ paymentDate: '2026-09-25', amount: 8450, concernedMonth: '2026-09', payee: BANK_ACCOUNT_PAYEE }],
  payeeOptions: [BANK_ACCOUNT_PAYEE, GIRO_PAYEE],
  payeeSource: 'PREVIOUS_PAYMENT',
};

const renderForm = (proposal: PaymentProposal = PROPOSAL) =>
  render(<ErrandUtbetalningForm errandId="errand-1" proposal={proposal} applicationMonth="2026-09" />);

describe('ErrandUtbetalningForm', () => {
  beforeEach(() => {
    vi.mocked(getErrandStakeholders).mockReset();
    vi.mocked(getErrandStakeholders).mockResolvedValue({ data: [APPLICANT] });
    vi.mocked(createPayment).mockReset();
    vi.mocked(createPayment).mockResolvedValue({ data: null });
    vi.mocked(getLifecarePaymentOptions).mockReset();
    // Betalsätt and betalningsmottagare are Lifecare's own lists for the insats, not the proposal's.
    vi.mocked(getLifecarePaymentOptions).mockResolvedValue({ data: LIFECARE_OPTIONS });
  });

  it('prefills date, amount and payee from the proposal', async () => {
    renderForm();

    // The betalsätt options come from Lifecare, so the value only sticks once they have loaded.
    await waitFor(() => {
      expect(screen.getByLabelText(/^Betalsätt/)).toHaveValue('Personkonto');
    });
    expect(screen.getByLabelText(/^Utbetalningsdatum/)).toHaveValue('2026-09-25');
    expect(screen.getByLabelText(/^Belopp/)).toHaveValue('8450,00');
    expect(screen.getByLabelText(/^Namn/)).toHaveValue('Test Testsson');
    expect(screen.getByLabelText(/^Kontonummer/)).toHaveValue('1234567');
  });

  it('lists the Lifecare payees as betalningsmottagare alternatives', async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Betalningsmottagare/)).toBeInTheDocument();
    });
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(expect.arrayContaining([expect.stringContaining('Hyresvärden AB')]));
  });

  it('opens clearing and account for a personkonto but leaves the postal address closed', async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Clearing/)).toBeEnabled();
    });
    expect(screen.getByLabelText(/^Kontonummer/)).toBeEnabled();
    expect(screen.getByLabelText(/^C\/O adress/)).toBeDisabled();
  });

  it('carries the chosen payee across and closes clearing for a giro', async () => {
    renderForm();
    // Wait for the payee list, since the dropdown's options come from it.
    await waitFor(() => {
      expect(screen.getByLabelText(/^Betalsätt/)).toHaveValue('Personkonto');
    });

    fireEvent.change(screen.getByLabelText(/^Betalningsmottagare/), { target: { value: '12' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Namn/)).toHaveValue('Hyresvärden AB');
    });
    expect(screen.getByLabelText(/^Ort/)).toHaveValue('Sundsvall');
    expect(screen.getByLabelText(/^Betalsätt/)).toHaveValue('Plusgiro');
    expect(screen.getByLabelText(/^Kontonummer/)).toHaveValue('5051-6905');
    // A giro number has no clearing number, so that field closes again.
    expect(screen.getByLabelText(/^Clearing/)).toBeDisabled();
  });

  it('shows why the proposal is incomplete when caremanagement says so', async () => {
    renderForm({ explanation: 'Ingen norm kunde läsas från Lifecare – beloppet kunde inte beräknas.' });

    await waitFor(() => {
      expect(
        screen.getByText('Ingen norm kunde läsas från Lifecare – beloppet kunde inte beräknas.')
      ).toBeInTheDocument();
    });
  });

  it('adds a message line for each click on the add button', async () => {
    renderForm();

    expect(screen.getAllByRole('textbox', { name: /^Meddelanderad \d/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till meddelanderad' }));

    await waitFor(() => {
      expect(screen.getAllByRole('textbox', { name: /^Meddelanderad \d/ })).toHaveLength(2);
    });
  });

  it('registers the utbetalning with the proposal values mapped to the API shape', async () => {
    const onSaved = vi.fn();
    render(
      <ErrandUtbetalningForm errandId="errand-1" proposal={PROPOSAL} applicationMonth="2026-09" onSaved={onSaved} />
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/^Belopp/)).toHaveValue('8450,00');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Nästa' }));

    await waitFor(() => {
      expect(createPayment).toHaveBeenCalledTimes(1);
    });
    // The comma decimal becomes a number, and the payee's name/account travel as their own fields —
    // Lifecare payees have no stakeholder id.
    expect(createPayment).toHaveBeenCalledWith(
      'errand-1',
      expect.objectContaining({
        amount: 8450,
        paymentDate: '2026-09-25',
        applicationMonth: '2026-09',
        paymentMethod: 'Personkonto',
        payeeName: 'Test Testsson',
        clearingNumber: '8327',
        accountNumber: '1234567',
      })
    );
    expect(vi.mocked(createPayment).mock.calls[0]?.[1]).not.toHaveProperty('payeeStakeholderId');
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('opens lokalbetalningsnummer only for a betalsätt Lifecare says takes one', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/^Betalsätt/)).toHaveValue('Personkonto');
    });
    expect(screen.getByLabelText(/^Lokalbetalningsnummer/)).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Betalsätt/), { target: { value: 'Plusgiro' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Lokalbetalningsnummer/)).toBeEnabled();
    });
  });

  it('sends the räkningsnummer Lifecare needs for a bankgiro utbetalning', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/^Belopp/)).toHaveValue('8450,00');
    });

    fireEvent.change(screen.getByLabelText(/^Räkningsnummer/), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nästa' }));

    await waitFor(() => {
      expect(createPayment).toHaveBeenCalledWith('errand-1', expect.objectContaining({ invoiceNumber: '123' }));
    });
  });

  it('reports a failed registration instead of silently doing nothing', async () => {
    vi.mocked(createPayment).mockResolvedValue({ error: 'boom' });
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/^Belopp/)).toHaveValue('8450,00');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Nästa' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Det gick inte att registrera utbetalningen');
    });
  });
});
