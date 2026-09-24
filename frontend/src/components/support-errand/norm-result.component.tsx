'use client';

import { cx } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import { isSurplus, NormResult } from '@utils/norm-result';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentBox } from './content-box.component';

/** The result amount in Lifecare's colours: green for a normöverskott, red for a normunderskott. */
const NormResultAmount: FC<{ result: NormResult; className?: string }> = ({ result, className }) => (
  <span
    className={cx(
      'tabular-nums font-bold',
      isSurplus(result) ? 'text-success-surface-primary' : 'text-error-surface-primary',
      className
    )}
  >
    {formatAmount(result.result)} kr
  </span>
);

/** "Normöverskott 954,00 kr" / "Normunderskott −5 674,00 kr" on one line. */
export const NormResultLine: FC<{ result: NormResult }> = ({ result }) => {
  const { t } = useTranslation('calculation');
  return (
    <p className="m-0 flex items-baseline gap-8 text-lead">
      <span className="font-bold">{isSurplus(result) ? t('result.surplus') : t('result.deficit')}</span>
      <NormResultAmount result={result} />
    </p>
  );
};

const SummaryRow: FC<{ label: string; amount: number; bold?: boolean }> = ({ label, amount, bold = false }) => (
  <div className={cx('flex justify-between gap-24', bold && 'font-bold')}>
    <span>{label}</span>
    <span className="tabular-nums">{formatAmount(amount)}</span>
  </div>
);

/**
 * The normberäkning's result at the top of the tab, laid out like Lifecare's Summering: the result in
 * green (överskott) or red (underskott), then inkomster, norm and utgifter down to the summa, and the
 * levnadskostnader i övrigt that take it to överskott/underskott.
 */
export const NormResultSummary: FC<{ result: NormResult }> = ({ result }) => {
  const { t } = useTranslation('calculation');
  return (
    <ContentBox>
      <div className="flex flex-col gap-16 max-w-[48rem]">
        <p className="m-0 flex items-baseline gap-8 text-large">
          <span className="font-bold">{t('result.title')}</span>
          <NormResultAmount result={result} />
        </p>
        <div className="flex flex-col gap-8">
          <SummaryRow label={t('result.income')} amount={result.income} />
          <SummaryRow label={t('result.norm')} amount={-result.norm} />
          <SummaryRow label={t('result.expenses')} amount={-result.expenses} />
          <SummaryRow label={t('result.sum')} amount={result.sum} bold />
          <SummaryRow label={t('result.specialExpenses')} amount={-result.specialExpenses} />
          <SummaryRow
            label={isSurplus(result) ? t('result.surplus') : t('result.deficit')}
            amount={result.result}
            bold
          />
        </div>
      </div>
    </ContentBox>
  );
};
