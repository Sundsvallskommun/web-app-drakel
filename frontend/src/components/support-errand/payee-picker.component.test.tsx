import { LifecarePayeeView } from '@data-contracts/backend/data-contracts';
import { createLifecarePayee } from '@services/lifecare-payment-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PayeePicker } from './payee-picker.component';

vi.mock('@services/lifecare-payment-service', () => ({
  createLifecarePayee: vi.fn(),
}));

const PAYMENT_METHODS = [
  { code: 14, name: 'Bankgiro via Plusgiro', localNumberEnabled: false, localNumberMandatory: false },
  { code: 5, name: 'Personkonto', localNumberEnabled: false, localNumberMandatory: false },
];

const CREATED: LifecarePayeeView = {
  id: 3,
  label: 'Hyresvärden',
  name: 'Hyresvärden AB',
  paymentMethodCode: 14,
  paymentMethod: 'Bankgiro via Plusgiro',
  clearing: '',
  accountNumber: '5051-6905',
  streetAddress: '',
  careOfAddress: '',
  postalCode: '',
  postalAddress: '',
  toRegisteredAddress: false,
};

const openAddForm = (onPayeeAdded = vi.fn()) => {
  render(
    <PayeePicker
      errandId="errand-1"
      payees={[]}
      paymentMethods={PAYMENT_METHODS}
      value=""
      onChange={vi.fn()}
      onPayeeAdded={onPayeeAdded}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Lägg till mottagare' }));
  fireEvent.change(screen.getByLabelText(/^Namn/), { target: { value: 'Hyresvärden AB' } });
  fireEvent.change(screen.getByLabelText(/^Betalsätt/), { target: { value: '14' } });
  fireEvent.change(screen.getByLabelText(/^Kontonummer/), { target: { value: '5051-6905' } });
};

/** The save button inside the add form — the one that opened it carries the same label. */
const saveButton = (): HTMLElement => {
  const [, save] = screen.getAllByRole('button', { name: 'Lägg till mottagare' });
  if (!save) {
    throw new Error('the add form did not render its save button');
  }
  return save;
};

describe('PayeePicker', () => {
  beforeEach(() => {
    vi.mocked(createLifecarePayee).mockReset();
  });

  it('offers the betalsätt Lifecare lists and adds the payee there with its code', async () => {
    vi.mocked(createLifecarePayee).mockResolvedValue({ data: CREATED });
    const onPayeeAdded = vi.fn();
    openAddForm(onPayeeAdded);

    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(onPayeeAdded).toHaveBeenCalledWith(CREATED);
    });
    expect(createLifecarePayee).toHaveBeenCalledWith(
      'errand-1',
      expect.objectContaining({ name: 'Hyresvärden AB', paymentMethod: 14, accountNumber: '5051-6905' })
    );
  });

  it('shows the reason Lifecare gave and keeps what was typed', async () => {
    vi.mocked(createLifecarePayee).mockResolvedValue({ error: 422, message: 'Kontonumret är ogiltigt' });
    openAddForm();

    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Kontonumret är ogiltigt');
    });
    expect(screen.getByLabelText(/^Kontonummer/)).toHaveValue('5051-6905');
  });
});
