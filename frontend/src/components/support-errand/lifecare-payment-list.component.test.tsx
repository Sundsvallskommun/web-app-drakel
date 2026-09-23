import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LifecareBalanceBox } from './lifecare-balance-box.component';
import { LifecarePaymentList } from './lifecare-payment-list.component';

const PAYMENT = {
  id: 9,
  payDate: '2026-09-23',
  concernedMonth: '2026-09',
  amount: 1,
  paymentMethod: 'Bankgiro via Plusgiro',
  recipient: 'Test',
  status: '',
  cancelled: false,
};

describe('LifecarePaymentList', () => {
  it('lists what Lifecare has registered on the insats, makulerade ones marked', () => {
    render(
      <LifecarePaymentList
        payments={[PAYMENT, { ...PAYMENT, id: 8, payDate: '2026-09-08', cancelled: true }]}
        isLoading={false}
        failed={false}
      />
    );

    expect(screen.getByText('Utbetalningar i Lifecare')).toBeInTheDocument();
    expect(screen.getByText('Registrerad')).toBeInTheDocument();
    expect(screen.getByText('Makulerad')).toBeInTheDocument();
  });

  it('says why when Lifecare would not hand the list over', () => {
    render(<LifecarePaymentList payments={[]} isLoading={false} failed errorMessage="Lifecare svarade inte" />);

    expect(screen.getByText('Lifecare svarade inte')).toBeInTheDocument();
  });
});

describe('LifecareBalanceBox', () => {
  it('shows the saldo as Lifecare counts it', () => {
    render(
      <LifecareBalanceBox
        balances={[{ name: 'Ek. Bistånd 3,00', approvedAmount: 5, bookedAmount: 2, balanceAmount: 3 }]}
        isLoading={false}
        failed={false}
      />
    );

    expect(screen.getByText('Beslutat belopp')).toBeInTheDocument();
    expect(screen.getByText('Kvar att disponera')).toBeInTheDocument();
  });

  it('says the beslut is not in Lifecare yet when the insats has no saldo', () => {
    render(<LifecareBalanceBox balances={[]} isLoading={false} failed={false} />);

    expect(screen.getByText(/beslutet är inte registrerat där/)).toBeInTheDocument();
  });
});
