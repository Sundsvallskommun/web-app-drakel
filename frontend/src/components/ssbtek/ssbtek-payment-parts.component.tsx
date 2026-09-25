'use client';

import { SsbtekPaymentPart } from '@data-contracts/backend/data-contracts';
import { formatDateRange } from '@utils/date-range';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { SsbtekAmount } from './ssbtek-amount.component';

/** A labelled value in a delförmån's specification: "Beloppstyp  Etableringsersättning". */
const PartField: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="flex gap-8 whitespace-nowrap">
    <dt className="font-bold">{label}</dt>
    <dd className="m-0">{children}</dd>
  </div>
);

/** A column of a delförmån's specification. */
const PartColumn: FC<{ children: ReactNode }> = ({ children }) => (
  <dl className="m-0 flex flex-col gap-16">{children}</dl>
);

/** One delförmån: what it is, how much of it and for how long, and its amounts — three columns, as in Figma. */
const PaymentPart: FC<{ part: SsbtekPaymentPart; number: number }> = ({ part, number }) => {
  const { t } = useTranslation('ssbtek');
  return (
    <div className="flex flex-col gap-24">
      <h4 className="font-sans text-label-medium text-dark-primary m-0">{t('parts.heading', { number })}</h4>
      <div className="flex flex-wrap gap-x-80 gap-y-16 text-small">
        <PartColumn>
          <PartField label={t('parts.benefit')}>{part.benefit ?? '—'}</PartField>
          <PartField label={t('parts.amountType')}>{part.amountType ?? '—'}</PartField>
          <PartField label={t('columns.period')}>{formatDateRange(part.periodFrom, part.periodTo, t)}</PartField>
        </PartColumn>
        <PartColumn>
          <PartField label={t('parts.extent')}>{part.extent ?? '—'}</PartField>
          <PartField label={t('parts.hours')}>{part.hours ?? '—'}</PartField>
          <PartField label={t('parts.days')}>{part.days ?? '—'}</PartField>
        </PartColumn>
        <PartColumn>
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
        </PartColumn>
      </div>
    </div>
  );
};

/** A payment's delförmåner, shown when its row is opened. */
export const SsbtekPaymentParts: FC<{ parts: SsbtekPaymentPart[] }> = ({ parts }) => (
  <div className="flex flex-col gap-40 py-10">
    {parts.map((part, index) => (
      <PaymentPart key={index} part={part} number={index + 1} />
    ))}
  </div>
);
