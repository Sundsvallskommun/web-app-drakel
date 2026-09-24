'use client';

import { LifecareBalanceView } from '@data-contracts/backend/data-contracts';
import { cx } from '@sk-web-gui/react';
import { displayAmount } from '@utils/format-amount';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { LabeledValue } from './labeled-value.component';

/**
 * "Att disponera": the insats's saldo as Lifecare counts it — what the beslut granted, what is already
 * booked and what is left. Lifecare's own figures, so an utbetalning made directly in Lifecare counts too.
 * No saldo means the beslut is not in Lifecare yet. Shown at the top of the Registrera utbetalning box.
 */
export const LifecareBalanceBox: FC<{ balances: LifecareBalanceView[]; isLoading: boolean; failed: boolean }> = ({
  balances,
  isLoading,
  failed,
}) => {
  const { t } = useTranslation('decision');

  const content = () => {
    if (isLoading) {
      return null;
    }
    if (failed) {
      return <p className="m-0 text-dark-secondary">{t('payment.disposal.unavailable')}</p>;
    }
    if (balances.length === 0) {
      return <p className="m-0 text-dark-secondary">{t('payment.disposal.none')}</p>;
    }
    return balances.map((balance) => (
      <div key={balance.name} className="flex flex-col gap-8">
        {balances.length > 1 ?
          <span className="font-bold">{balance.name}</span>
        : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
          <LabeledValue label={t('payment.disposal.decided')}>
            <span className="tabular-nums">{displayAmount(balance.approvedAmount)}</span>
          </LabeledValue>
          <LabeledValue label={t('payment.disposal.committed')}>
            <span className="tabular-nums">{displayAmount(balance.bookedAmount)}</span>
          </LabeledValue>
          <LabeledValue label={t('payment.disposal.remaining')}>
            {/* Negative means more is booked than the beslut allows — worth seeing, not hiding. */}
            <span className={cx('tabular-nums font-bold', balance.balanceAmount < 0 && 'text-error-surface-primary')}>
              {displayAmount(balance.balanceAmount)}
            </span>
          </LabeledValue>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col gap-16">
      <h4 className="text-base font-bold m-0">{t('payment.disposal.title')}</h4>
      {content()}
    </div>
  );
};
