'use client';

import { SsbtekPayment } from '@data-contracts/backend/data-contracts';
import { Button, Table } from '@sk-web-gui/react';
import { formatDateRange } from '@utils/date-range';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SsbtekAmount } from './ssbtek-amount.component';
import { SsbtekPaymentParts } from './ssbtek-payment-parts.component';

/** The number of columns in the payment table, which the opened delförmåner row spans. */
const SSBTEK_PAYMENT_COLUMN_COUNT = 9;

/** A payment in the month's table; a payment the agency specifies opens to show its delförmåner below it. */
export const SsbtekPaymentRow: FC<{ payment: SsbtekPayment }> = ({ payment }) => {
  const { t } = useTranslation('ssbtek');
  const [open, setOpen] = useState<boolean>(false);
  const hasParts = payment.parts.length > 0;

  return (
    <>
      <Table.Row>
        <Table.Column className="w-48">
          {hasParts ?
            <Button
              variant="tertiary"
              showBackground={false}
              size="sm"
              iconButton
              aria-expanded={open}
              aria-label={t(open ? 'parts.close' : 'parts.open', { benefit: payment.benefit })}
              leftIcon={open ? <ChevronUp /> : <ChevronDown />}
              onClick={() => {
                setOpen((wasOpen) => !wasOpen);
              }}
            />
          : null}
        </Table.Column>
        <Table.Column>{payment.benefit}</Table.Column>
        <Table.Column className="tabular-nums whitespace-nowrap">{payment.paidOn ?? '—'}</Table.Column>
        <Table.Column>{payment.type ?? '—'}</Table.Column>
        <Table.Column>
          <SsbtekAmount amount={payment.netAmount} />
        </Table.Column>
        <Table.Column>
          <SsbtekAmount amount={payment.grossAmount} />
        </Table.Column>
        <Table.Column>
          <SsbtekAmount amount={payment.deductionAmount} />
        </Table.Column>
        <Table.Column>
          <SsbtekAmount amount={payment.taxAmount} />
        </Table.Column>
        <Table.Column className="tabular-nums whitespace-nowrap">
          {formatDateRange(payment.periodFrom, payment.periodTo, t)}
        </Table.Column>
      </Table.Row>
      {open ?
        <Table.Row className="bg-background-200">
          <Table.Column colSpan={SSBTEK_PAYMENT_COLUMN_COUNT} className="px-24">
            <SsbtekPaymentParts parts={payment.parts} />
          </Table.Column>
        </Table.Row>
      : null}
    </>
  );
};
