'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { LifecareRegisteredPaymentView } from '@data-contracts/backend/data-contracts';
import { Table } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { displayAmount } from '@utils/format-amount';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentBox } from './content-box.component';

/**
 * The utbetalningar registered on the insats, read live from Lifecare — everything paid on it, also what
 * was registered directly in Lifecare. Read-only: an utbetalning is changed or makulerad in Lifecare.
 */
export const LifecarePaymentList: FC<{
  payments: LifecareRegisteredPaymentView[];
  isLoading: boolean;
  /** Lifecare's own reason when it would not hand the list over. */
  errorMessage?: string;
  failed: boolean;
}> = ({ payments, isLoading, errorMessage, failed }) => {
  const { t, i18n } = useTranslation('decision');

  return (
    <ContentBox title={t('payment.lifecareList.title')}>
      <AsyncContent
        isLoading={isLoading}
        error={failed}
        errorText={errorMessage ?? t('payment.lifecareList.loadError')}
        isEmpty={payments.length === 0}
        emptyText={t('payment.lifecareList.empty')}
      >
        <Table dense>
          <Table.Header>
            <Table.HeaderColumn>{t('payment.list.paymentDate')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('payment.list.applicationMonth')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('payment.list.amount')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('payment.list.payee')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('payment.list.paymentMethod')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('payment.list.statusHeading')}</Table.HeaderColumn>
          </Table.Header>
          <Table.Body>
            {payments.map((payment) => (
              <Table.Row key={payment.id}>
                <Table.Column>{payment.payDate || '—'}</Table.Column>
                <Table.Column>
                  {payment.concernedMonth ? formatApplicationMonth(payment.concernedMonth, i18n.language) : '—'}
                </Table.Column>
                <Table.Column className="tabular-nums">{displayAmount(payment.amount)}</Table.Column>
                <Table.Column>{payment.recipient || '—'}</Table.Column>
                <Table.Column>{payment.paymentMethod || '—'}</Table.Column>
                <Table.Column>
                  {payment.cancelled ?
                    t('payment.lifecareList.cancelled')
                  : payment.status || t('payment.lifecareList.registered')}
                </Table.Column>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </AsyncContent>
    </ContentBox>
  );
};
