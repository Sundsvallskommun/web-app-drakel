'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { useErrandPayment } from '@hooks/use-errand-payment';
import { useLifecarePaymentOptions } from '@hooks/use-lifecare-payment-options';
import { useLifecarePayments } from '@hooks/use-lifecare-payments';
import { Button } from '@sk-web-gui/react';
import { RotateCcw } from 'lucide-react';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentBox } from './content-box.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { ErrandUtbetalningForm } from './errand-utbetalning-form.component';
import { LifecareBalanceBox } from './lifecare-balance-box.component';
import { LifecarePaymentList } from './lifecare-payment-list.component';
import { LockedBanner } from './lockable-section.component';
import { PaymentStatusRow } from './payment-status-row.component';

// How many of the insats's utbetalningar the tab lists — the latest ones, newest first.
const LATEST_PAYMENT_COUNT = 5;

/**
 * "Utbetalning" tab, read from Lifecare: the payment status for the application month on one row, the form
 * for a new utbetalning with the insats's saldo and Lifecare's own proposal, and the latest utbetalningar.
 * The form registers the utbetalning in Lifecare straight away; careM keeps no copy.
 */
export const ErrandUtbetalning: FC<{
  errandId: string;
  /** Whether the section is approved — only shows the locked banner, since the tab itself is read-only. */
  locked?: boolean;
  /** Rendered to the right of the section heading (the "Markera som komplett" approval control). */
  headerSlot?: ReactNode;
}> = ({ errandId, locked = false, headerSlot }) => {
  const { t } = useTranslation('decision');
  const { status, isLoading, error, refresh } = useErrandPayment(errandId);
  const lifecareOptions = useLifecarePaymentOptions(errandId);
  const lifecarePayments = useLifecarePayments(errandId);

  const refreshAll = (): void => {
    refresh();
    lifecareOptions.refresh();
    lifecarePayments.refresh();
  };

  const renderStatus = (): ReactNode => {
    if (isLoading || error || !status) {
      return (
        <AsyncContent isLoading={isLoading} error={error ?? !status} errorText={t('payment.loadError')} centered>
          {null}
        </AsyncContent>
      );
    }
    return <PaymentStatusRow status={status} />;
  };

  return (
    <div className="flex flex-col gap-24">
      <ErrandSectionHeader
        title={t('payment.header.title')}
        description={t('payment.header.description')}
        action={headerSlot}
      >
        {locked ?
          <LockedBanner />
        : null}
      </ErrandSectionHeader>

      <ContentBox
        title={t('payment.statusTitle')}
        action={
          <Button size="sm" variant="tertiary" leftIcon={<RotateCcw />} disabled={isLoading} onClick={refresh}>
            {t('common:update')}
          </Button>
        }
      >
        {renderStatus()}
      </ContentBox>

      <ContentBox title={t('payment.form.title')}>
        {/* What is left on the saldo sits with the form — the proposed belopp is exactly that sum. */}
        <LifecareBalanceBox
          balances={lifecareOptions.options.balances}
          isLoading={lifecareOptions.isLoading}
          failed={!!lifecareOptions.error}
        />
        <ErrandUtbetalningForm
          errandId={errandId}
          options={lifecareOptions.options}
          optionsError={lifecareOptions.errorMessage}
          disabled={locked}
          onSaved={refreshAll}
        />
      </ContentBox>

      <LifecarePaymentList
        payments={lifecarePayments.payments.slice(0, LATEST_PAYMENT_COUNT)}
        isLoading={lifecarePayments.isLoading}
        failed={!!lifecarePayments.error}
        errorMessage={lifecarePayments.errorMessage}
      />
    </div>
  );
};
