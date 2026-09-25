'use client';

import { useSsbtekPayments } from '@hooks/use-ssbtek-payments';
import { Spinner } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { formatDateRange } from '@utils/date-range';
import { groupByPaymentMonth } from '@utils/ssbtek-payment-months';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { SsbtekMonthSection } from './ssbtek-month-section.component';

/**
 * The payments SSBTEK reports to the errand's household — the sökande and any medsökande — a table per month they
 * were paid, newest first. Shared by the SSBTEK page and the panel at the foot of the errand.
 */
export const SsbtekPayments: FC<{ errandId: string }> = ({ errandId }) => {
  const { t, i18n } = useTranslation('ssbtek');
  const { view, isLoading, error, errorMessage } = useSsbtekPayments(errandId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size={4} aria-label={t('loading')} />
      </div>
    );
  }
  if (error) {
    return <p className="text-error-surface-primary m-0">{errorMessage ?? t('loadError')}</p>;
  }

  const months = groupByPaymentMonth(view.payments);
  return (
    <div className="flex flex-col gap-32">
      <p className="text-small text-dark-secondary m-0">
        {t('period', { period: formatDateRange(view.from, view.to, t) })}
      </p>
      {view.coApplicantUnavailable ?
        <p className="text-warning-surface-primary m-0">{t('coApplicantUnavailable')}</p>
      : null}
      {months.length === 0 ?
        <p className="m-0">{t('empty')}</p>
      : months.map(({ month, payments }) => (
          <SsbtekMonthSection
            key={month ?? 'no-date'}
            label={month ? formatApplicationMonth(`${month}-01`, i18n.language) : t('noDate')}
            payments={payments}
            showPerson={view.hasCoApplicant}
          />
        ))
      }
    </div>
  );
};
