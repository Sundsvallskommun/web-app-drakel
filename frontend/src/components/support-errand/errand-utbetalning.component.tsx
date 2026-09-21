'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { useErrandPayment } from '@hooks/use-errand-payment';
import { usePaymentProposal } from '@hooks/use-payment-proposal';
import { PaymentProposalWarning, PaymentStatus } from '@services/payment-service';
import { Alert } from '@sk-web-gui/alert';
import { Button } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { RotateCcw } from 'lucide-react';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentBox } from './content-box.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { ErrandUtbetalningForm } from './errand-utbetalning-form.component';
import { LabeledValue } from './labeled-value.component';
import { LockedBanner } from './lockable-section.component';

/** The Lifecare payment status as an Alert: unavailable, utbetald or not yet utbetald. */
const PaymentStatusAlert: FC<{ status: PaymentStatus }> = ({ status }) => {
  const { t } = useTranslation('decision');

  return (
    status.unavailable ?
      <Alert type="neutral">
        <Alert.Icon />
        <Alert.Content>
          <Alert.Content.Title className="font-bold">{t('payment.unavailable.title')}</Alert.Content.Title>
          <Alert.Content.Description>{t('payment.unavailable.description')}</Alert.Content.Description>
        </Alert.Content>
      </Alert>
    : status.effectuated ?
      <Alert type="success">
        <Alert.Icon />
        <Alert.Content>
          <Alert.Content.Title className="font-bold">{t('payment.paid.title')}</Alert.Content.Title>
          {status.paymentDate ?
            <Alert.Content.Description>
              {t('payment.paid.paymentDate', { date: status.paymentDate })}
            </Alert.Content.Description>
          : null}
        </Alert.Content>
      </Alert>
    : <Alert type="warning">
        <Alert.Icon />
        <Alert.Content>
          <Alert.Content.Title className="font-bold">{t('payment.notPaid.title')}</Alert.Content.Title>
          <Alert.Content.Description>{t('payment.notPaid.description')}</Alert.Content.Description>
        </Alert.Content>
      </Alert>
  );
};

/** The PAYMENT-section warnings the utbetalningsförslag raised, shown above the form. */
const PaymentProposalWarnings: FC<{ warnings: PaymentProposalWarning[] }> = ({ warnings }) => {
  const openWarnings = warnings.filter((warning) => warning.status === 'OPEN');
  if (openWarnings.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12">
      {openWarnings.map((warning, index) => (
        <Alert key={warning.id ?? index} type="warning">
          <Alert.Icon />
          <Alert.Content>
            {/* typeDisplayName is caremanagement's own Swedish label — no local translation table. */}
            <Alert.Content.Title className="font-bold">{warning.typeDisplayName ?? warning.type}</Alert.Content.Title>
            {warning.message ?
              <Alert.Content.Description>{warning.message}</Alert.Content.Description>
            : null}
          </Alert.Content>
        </Alert>
      ))}
    </div>
  );
};

/**
 * "Utbetalning" tab — reads whether the Lifecare utbetalning for the errand's application month has
 * been effectuated (caremanagement payment-status). Read-only; the actual utbetalning happens in
 * Lifecare.
 */
export const ErrandUtbetalning: FC<{
  errandId: string;
  /** Whether the section is approved — only shows the locked banner, since the tab itself is read-only. */
  locked?: boolean;
  /** Rendered to the right of the section heading (the "Markera som komplett" approval control). */
  headerSlot?: ReactNode;
}> = ({ errandId, locked = false, headerSlot }) => {
  const { t, i18n } = useTranslation('decision');
  const { status, isLoading, error, refresh } = useErrandPayment(errandId);
  const { proposal, isLoading: proposalLoading, error: proposalError } = usePaymentProposal(errandId);

  const renderStatus = (): ReactNode => {
    if (isLoading || error || !status) {
      return (
        <AsyncContent isLoading={isLoading} error={error ?? !status} errorText={t('payment.loadError')} centered>
          {null}
        </AsyncContent>
      );
    }
    return (
      <>
        <LabeledValue label={t('payment.applicationMonth')}>
          {formatApplicationMonth(status.applicationMonth, i18n.language)}
        </LabeledValue>
        <PaymentStatusAlert status={status} />
      </>
    );
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
        <AsyncContent
          isLoading={proposalLoading}
          error={proposalError}
          errorText={t('payment.form.proposalLoadError')}
          centered
        >
          <div className="flex flex-col gap-24">
            <PaymentProposalWarnings warnings={proposal.warnings ?? []} />
            <ErrandUtbetalningForm
              errandId={errandId}
              proposal={proposal}
              applicationMonth={status?.applicationMonth}
              disabled={locked}
              onSaved={refresh}
            />
          </div>
        </AsyncContent>
      </ContentBox>
    </div>
  );
};
