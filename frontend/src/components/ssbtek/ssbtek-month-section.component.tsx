'use client';

import { SsbtekPayment } from '@data-contracts/backend/data-contracts';
import { Table } from '@sk-web-gui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FC, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SsbtekPaymentRow } from './ssbtek-payment-row.component';

/**
 * One month's payments: the month as a heading that opens and closes its table. Open to begin with. With
 * `showPerson` (the errand has a medsökande) a Person column says whose each payment is.
 */
export const SsbtekMonthSection: FC<{ label: string; payments: SsbtekPayment[]; showPerson: boolean }> = ({
  label,
  payments,
  showPerson,
}) => {
  const { t } = useTranslation('ssbtek');
  const [open, setOpen] = useState<boolean>(true);
  const tableId = useId();

  return (
    <section className="flex flex-col gap-16">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tableId}
        className="flex items-center gap-12 self-start"
        onClick={() => {
          setOpen((wasOpen) => !wasOpen);
        }}
      >
        {open ?
          <ChevronUp className="w-20 h-20" aria-hidden />
        : <ChevronDown className="w-20 h-20" aria-hidden />}
        <h2 className="text-h4-sm m-0">{label}</h2>
      </button>
      {open ?
        <Table id={tableId} dense background>
          <Table.Header>
            <Table.HeaderColumn>
              <span className="sr-only">{t('parts.column')}</span>
            </Table.HeaderColumn>
            {showPerson ?
              <Table.HeaderColumn>{t('columns.person')}</Table.HeaderColumn>
            : null}
            <Table.HeaderColumn>{t('columns.benefit')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.paidOn')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.type')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.netAmount')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.grossAmount')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.deductionAmount')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.taxAmount')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.period')}</Table.HeaderColumn>
          </Table.Header>
          <Table.Body>
            {payments.map((payment, index) => (
              <SsbtekPaymentRow
                key={`${payment.person}-${payment.source}-${payment.paidOn ?? ''}-${String(index)}`}
                payment={payment}
                showPerson={showPerson}
              />
            ))}
          </Table.Body>
        </Table>
      : null}
    </section>
  );
};
