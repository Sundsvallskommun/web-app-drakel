'use client';

import { SsbtekPayment } from '@data-contracts/backend/data-contracts';
import { Button, Table } from '@sk-web-gui/react';
import { formatDateRange } from '@utils/date-range';
import { ssbtekPersonLabel } from '@utils/ssbtek-person-label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SsbtekAmount } from './ssbtek-amount.component';
import { SsbtekPaymentParts } from './ssbtek-payment-parts.component';

/**
 * The number of data columns in the payment table — all but the open/close column — which the opened delförmåner
 * span, so they line up under the first data column. One more with Person.
 */
const SSBTEK_PAYMENT_DATA_COLUMN_COUNT = 8;

/** The grey an opened payment and its delförmåner share, as in Figma. */
const OPENED_ROW_BACKGROUND = 'bg-background-color-mixin-1';

/**
 * A payment in the month's table; a payment the agency specifies opens to show its delförmåner below it. With
 * `showPerson` (the errand has a medsökande or children) it says whose payment it is.
 */
export const SsbtekPaymentRow: FC<{ payment: SsbtekPayment; showPerson: boolean }> = ({ payment, showPerson }) => {
  const { t } = useTranslation('ssbtek');
  const [open, setOpen] = useState<boolean>(false);
  const hasParts = payment.parts.length > 0;

  return (
    <>
      <Table.Row className={open ? OPENED_ROW_BACKGROUND : undefined}>
        <Table.Column>
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
        {showPerson ?
          <Table.Column>{ssbtekPersonLabel(payment, t)}</Table.Column>
        : null}
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
        <Table.Column className="tabular-nums">{formatDateRange(payment.periodFrom, payment.periodTo, t)}</Table.Column>
      </Table.Row>
      {open ?
        <Table.Row className={OPENED_ROW_BACKGROUND}>
          <Table.Column />
          <Table.Column colSpan={SSBTEK_PAYMENT_DATA_COLUMN_COUNT + (showPerson ? 1 : 0)}>
            <SsbtekPaymentParts parts={payment.parts} />
          </Table.Column>
        </Table.Row>
      : null}
    </>
  );
};
