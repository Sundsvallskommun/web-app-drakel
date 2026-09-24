'use client';

import { displayAmount } from '@utils/format-amount';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Under the sökandes amount on an income jobbstimulans applies to: what jobbstimulans takes off the gross
 * entered, and what Lifecare counts — "Jobbstimulans −1 250,00 · Räknas 3 750,00". Renders nothing when
 * jobbstimulans takes nothing off.
 */
export const JobStimulusIncomeNote: FC<{ deduction?: number; counted?: number }> = ({ deduction, counted }) => {
  const { t } = useTranslation('calculation');
  if (deduction === undefined || deduction <= 0) {
    return null;
  }
  return (
    <span className="block mt-4 text-small text-dark-secondary tabular-nums">
      {t('incomes.jobStimulusDeduction', { amount: displayAmount(deduction) })}
      {' · '}
      <span className="font-bold text-dark-primary">
        {t('incomes.countedAmount', { amount: displayAmount(counted) })}
      </span>
    </span>
  );
};
