'use client';

import { SsbtekPaymentPart } from '@data-contracts/backend/data-contracts';
import { formatDateRange } from '@utils/date-range';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { SsbtekAmount } from './ssbtek-amount.component';

/** A labelled value in a delförmån's specification: "Beloppstyp  Etableringsersättning". */
const PartField: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="flex gap-8">
    <dt className="font-bold">{label}</dt>
    <dd className="m-0">{children}</dd>
  </div>
);

/** One delförmån: what it is, how much of it and for how long, and its amounts — three columns, as in Figma. */
const PaymentPart: FC<{ part: SsbtekPaymentPart; number: number }> = ({ part, number }) => {
  const { t } = useTranslation('ssbtek');
  return (
    <div className="flex flex-col gap-12">
      <h4 className="text-label-medium m-0">{t('parts.heading', { number })}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-40 gap-y-8 text-small max-w-[80rem]">
        <dl className="m-0 flex flex-col gap-8">
          <PartField label={t('parts.benefit')}>{part.benefit ?? '—'}</PartField>
          <PartField label={t('parts.amountType')}>{part.amountType ?? '—'}</PartField>
          <PartField label={t('columns.period')}>{formatDateRange(part.periodFrom, part.periodTo, t)}</PartField>
        </dl>
        <dl className="m-0 flex flex-col gap-8">
          <PartField label={t('parts.extent')}>{part.extent ?? '—'}</PartField>
          <PartField label={t('parts.hours')}>{part.hours ?? '—'}</PartField>
          <PartField label={t('parts.days')}>{part.days ?? '—'}</PartField>
        </dl>
        <dl className="m-0 flex flex-col gap-8">
          <PartField label={t('columns.netAmount')}>
            <SsbtekAmount amount={part.netAmount} />
          </PartField>
          <PartField label={t('columns.grossAmount')}>
            <SsbtekAmount amount={part.grossAmount} />
          </PartField>
          <PartField label={t('columns.deductionAmount')}>
            <SsbtekAmount amount={part.deductionAmount} />
          </PartField>
          <PartField label={t('columns.taxAmount')}>
            <SsbtekAmount amount={part.taxAmount} />
          </PartField>
        </dl>
      </div>
    </div>
  );
};

/** A payment's delförmåner, shown when its row is opened. */
export const SsbtekPaymentParts: FC<{ parts: SsbtekPaymentPart[] }> = ({ parts }) => (
  <div className="flex flex-col gap-32 py-16">
    {parts.map((part, index) => (
      <PaymentPart key={index} part={part} number={index + 1} />
    ))}
  </div>
);
