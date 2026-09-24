import { LifecarePayeeView, LifecarePaymentOptionsView } from '@data-contracts/backend/data-contracts';
import { getErrandStakeholders } from '@services/errand-service/errand-service';
import { createPayment } from '@services/payment-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandUtbetalningForm } from './errand-utbetalning-form.component';

vi.mock('@services/errand-service/errand-service', () => ({
  getErrandStakeholders: vi.fn(),
}));

vi.mock('@services/payment-service', () => ({
  createPayment: vi.fn(),
}));

const APPLICANT = {
  id: 'stakeholder-1',
  personalNumber: '880209-T050',
  firstName: 'Test',
  lastName: 'Testsson',
};

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

// Betalsätt, betalningsmottagare and konteringsrader are Lifecare's own lists for the insats, handed in by the tab.
const LIFECARE_OPTIONS: LifecarePaymentOptionsView = {
  paymentMethods: [
    { code: 5, name: 'Personkonto', localNumberEnabled: false, localNumberMandatory: false },
    { code: 4, name: 'Plusgiro', localNumberEnabled: true, localNumberMandatory: false },
    { code: 14, name: 'Bankgiro via Plusgiro', localNumberEnabled: false, localNumberMandatory: false },
  ],
  payees: [lifecarePayee(11, BANK_ACCOUNT_PAYEE), lifecarePayee(12, GIRO_PAYEE)],
  postings: [
    { purpose: 1, text: 'Försörjningsstöd exklusive tillfälligt boende' },
    { purpose: 3, text: 'Hälso och sjukvård' },
  ],
  balances: [],
  concernMonths: [
    { month: '2026-09', label: 'September 2026' },
    { month: '2026-08', label: 'Augusti 2026' },
  ],
  // Lifecare's own proposal: its date and month, what is left on the saldo, the payee last paid.
  proposal: { paymentDate: '2026-09-25', concernedMonth: '2026-09', amount: 8450, payeeId: 11 },
};

const renderForm = ({
  options = LIFECARE_OPTIONS,
  optionsError,
  onSaved,
}: { options?: LifecarePaymentOptionsView; optionsError?: string; onSaved?: () => void } = {}) =>
  render(<ErrandUtbetalningForm errandId="errand-1" options={options} optionsError={optionsError} onSaved={onSaved} />);

describe('ErrandUtbetalningForm', () => {
  beforeEach(() => {
    vi.mocked(getErrandStakeholders).mockReset();
    vi.mocked(getErrandStakeholders).mockResolvedValue({ data: [APPLICANT] });
    vi.mocked(createPayment).mockReset();
    vi.mocked(createPayment).mockResolvedValue({ data: null });
  });

  it('prefills date, month, amount and payee from the Lifecare proposal', async () => {
    renderForm();

    // The betalsätt options come from Lifecare, so the value only sticks once they have loaded.
    await waitFor(() => {
      expect(screen.getByLabelText(/^Betalsätt/)).toHaveValue('Personkonto');
    });
    expect(screen.getByLabelText(/^Utbetalningsdatum/)).toHaveValue('2026-09-25');
    expect(screen.getByLabelText(/^Belopp/)).toHaveValue('8450,00');
    expect(screen.getByLabelText(/^Namn/)).toHaveValue('Test Testsson');
    expect(screen.getByLabelText(/^Kontonummer/)).toHaveValue('1234567');
    expect(screen.getByLabelText(/^Avser månad/)).toHaveValue('2026-09');
  });

  it('offers the months Lifecare lets the utbetalning concern', async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Augusti 2026' })).toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: 'September 2026' })).toBeInTheDocument();
  });

  it('leaves amount and payee empty when Lifecare proposes none', async () => {
    renderForm({ options: { ...LIFECARE_OPTIONS, proposal: { paymentDate: '2026-09-25' } } });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Utbetalningsdatum/)).toHaveValue('2026-09-25');
    });
    expect(screen.getByLabelText(/^Belopp/)).toHaveValue('');
    expect(screen.getByLabelText(/^Betalningsmottagare/)).toHaveValue('');
  });

  it('keeps what the handläggare typed when the lists are read again with the same proposal', async () => {
    const { rerender } = renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/^Belopp/)).toHaveValue('8450,00');
    });
    fireEvent.change(screen.getByLabelText(/^Belopp/), { target: { value: '100,00' } });

    rerender(
      <ErrandUtbetalningForm
        errandId="errand-1"
        options={{ ...LIFECARE_OPTIONS, payees: [...LIFECARE_OPTIONS.payees] }}
      />
    );

    expect(screen.getByLabelText(/^Belopp/)).toHaveValue('100,00');
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
    // No payee proposed, so the recipient is typed in and the betalsätt decides which fields open.
    renderForm({ options: { ...LIFECARE_OPTIONS, proposal: { paymentDate: '2026-09-25' } } });
    fireEvent.change(screen.getByLabelText(/^Betalsätt/), { target: { value: 'Personkonto' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Clearing/)).toBeEnabled();
    });
    expect(screen.getByLabelText(/^Kontonummer/)).toBeEnabled();
    expect(screen.getByLabelText(/^C\/O adress/)).toBeDisabled();
  });

  it('locks the recipient fields to the chosen betalningsmottagare', async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/^Betalsätt/)).toHaveValue('Personkonto');
    });
    expect(screen.getByLabelText(/^Betalsätt/)).toBeDisabled();
    expect(screen.getByLabelText(/^Kontonummer/)).toBeDisabled();
    expect(screen.getByLabelText(/^Namn/)).toBeDisabled();
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
    renderForm({ onSaved });
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

  it('books the utbetalning on the ändamål picked among the insats konteringsrader', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Hälso och sjukvård' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/^Kontering/), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nästa' }));

    await waitFor(() => {
      expect(createPayment).toHaveBeenCalledWith('errand-1', expect.objectContaining({ accountingCode: '3' }));
    });
  });

  it('picks the only konteringsrad of an insats that has one', async () => {
    renderForm({
      options: {
        ...LIFECARE_OPTIONS,
        postings: [{ purpose: 1, text: 'Försörjningsstöd exklusive tillfälligt boende' }],
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^Kontering/)).toHaveValue('1');
    });
  });

  it('says why when Lifecare will not hand over its lists for the insats', async () => {
    renderForm({
      options: { paymentMethods: [], payees: [], postings: [], balances: [], concernMonths: [], proposal: {} },
      optionsError: '119: Ekonomisk enhet saknas för angiven organisation.',
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('119: Ekonomisk enhet saknas för angiven organisation.');
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
