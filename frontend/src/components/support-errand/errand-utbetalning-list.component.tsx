'use client';

import { RecordSource } from '@interfaces/record-source';
import { Payment } from '@services/payment-service';
import { Table } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { displayAmount } from '@utils/format-amount';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentBox } from './content-box.component';
import { LifecareSourceBadge } from './lifecare-source-badge.component';
import { RegisterPaymentButton } from './register-payment-button.component';

/** Sort newest first by the payment date, falling back to when the row was created. */
const byDateDesc = (first: Payment, second: Payment): number =>
  (second.paymentDate ?? second.created ?? '').localeCompare(first.paymentDate ?? first.created ?? '');

/**
 * The status as a label, with Lifecare's own reason underneath when the robot could not register the
 * utbetalning. The reason is shown word for word — it is Lifecare's message about the handläggare's
 * payment, and rewording it would only put our guess between them and the system that refused it.
 *
 * caremanagement documents DRAFT, PENDING_REGISTRATION, REGISTERED and FAILED, but an unknown code is
 * shown as it came rather than hidden or mislabelled — the list has to stay readable when caremanagement
 * adds a status before Draken knows about it, which is what happened to PENDING_REGISTRATION itself.
 */
const StatusLabel: FC<{ status?: string; lifecareDetail?: string }> = ({ status, lifecareDetail }) => {
  const { t } = useTranslation('decision');
  if (!status) {
    return <span>—</span>;
  }
  return (
    <span className="flex flex-col gap-2">
      <span>{t(`payment.list.status.${status}`, { defaultValue: status })}</span>
      {lifecareDetail ?
        <span className="text-small text-error-surface-primary">{lifecareDetail}</span>
      : null}
    </span>
  );
};

// An utbetalning "Besluta och utbetala" created but could not yet register in Lifecare.
const PENDING_REGISTRATION = 'PENDING_REGISTRATION';

/**
 * The utbetalningar registered on the errand. Rows come from two places: the drafts a handläggare saved
 * in the form below, and the ones "Besluta och utbetala" created. A registered utbetalning is changed in
 * Lifecare, not here; one still waiting for Lifecare can be registered from its row.
 */
export const ErrandUtbetalningList: FC<{
  errandId: string;
  payments: Payment[];
  /** Called after a waiting utbetalning was registered or refused, so the list can be read again. */
  onPaymentsChanged: () => void;
}> = ({ errandId, payments, onPaymentsChanged }) => {
  const { t, i18n } = useTranslation('decision');
  const rows = [...payments].sort(byDateDesc);

  return (
    <ContentBox>
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
          {rows.length === 0 ?
            <Table.Row>
              <Table.Column>{t('payment.list.empty')}</Table.Column>
            </Table.Row>
          : rows.map((payment, index) => (
              <Table.Row key={payment.id ?? index}>
                <Table.Column>{payment.paymentDate ?? '—'}</Table.Column>
                <Table.Column>
                  {payment.applicationMonth ? formatApplicationMonth(payment.applicationMonth, i18n.language) : '—'}
                </Table.Column>
                <Table.Column className="tabular-nums">{displayAmount(payment.amount)}</Table.Column>
                <Table.Column>
                  <span className="flex items-center gap-8">
                    {payment.payeeName ?? '—'}
                    <LifecareSourceBadge source={payment.source as RecordSource | undefined} />
                  </span>
                </Table.Column>
                <Table.Column>{payment.paymentMethod ?? '—'}</Table.Column>
                <Table.Column>
                  <span className="flex flex-col gap-8">
                    <StatusLabel status={payment.status} lifecareDetail={payment.lifecareDetail} />
                    {payment.status === PENDING_REGISTRATION && payment.id ?
                      <RegisterPaymentButton
                        errandId={errandId}
                        paymentId={payment.id}
                        onRegistered={onPaymentsChanged}
                      />
                    : null}
                  </span>
                </Table.Column>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>
    </ContentBox>
  );
};
