'use client';

import { PaymentStatus } from '@services/payment-service';
import { cx } from '@sk-web-gui/react';
import { displayAmount } from '@utils/format-amount';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The utbetalning status for the application month on one row: date, belopp and Lifecare's status — or,
 * when the status could not be read, why not.
 */
export const PaymentStatusRow: FC<{ status: PaymentStatus }> = ({ status }) => {
  const { t } = useTranslation('decision');

  if (status.unavailable) {
    return <p className="m-0 text-error-surface-primary">{t('payment.statusRow.unavailable')}</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-24 tabular-nums">
      <span>{status.paymentDate ?? '—'}</span>
      <span>{displayAmount(status.amount)}</span>
      <span
        className={cx(
          'font-bold',
          status.effectuated ? 'text-success-surface-primary' : 'text-warning-surface-primary'
        )}
      >
        {status.effectuated ? (status.status ?? t('payment.statusRow.paid')) : t('payment.statusRow.notPaid')}
      </span>
    </div>
  );
};
