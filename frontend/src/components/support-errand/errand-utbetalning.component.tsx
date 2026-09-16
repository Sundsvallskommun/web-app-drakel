'use client';

import { useErrandPayment } from '@hooks/use-errand-payment';
import { PaymentStatus } from '@services/payment-service';
import { Alert } from '@sk-web-gui/alert';
import { Button, Spinner } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { RotateCcw } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { ContentBox } from './content-box.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { LabeledValue } from './labeled-value.component';
import { LockedBanner } from './lockable-section.component';

/** The Lifecare payment status as an Alert: unavailable, utbetald or not yet utbetald. */
const PaymentStatusAlert: FC<{ status: PaymentStatus }> = ({ status }) =>
  status.unavailable ?
    <Alert type="neutral">
      <Alert.Icon />
      <Alert.Content>
        <Alert.Content.Title className="font-bold">Utbetalningsstatus är inte tillgänglig</Alert.Content.Title>
        <Alert.Content.Description>
          Status hämtas från Lifecare och kunde inte läsas just nu. Försök igen senare.
        </Alert.Content.Description>
      </Alert.Content>
    </Alert>
  : status.effectuated ?
    <Alert type="success">
      <Alert.Icon />
      <Alert.Content>
        <Alert.Content.Title className="font-bold">Utbetald</Alert.Content.Title>
        {status.paymentDate ?
          <Alert.Content.Description>Utbetalningsdatum: {status.paymentDate}</Alert.Content.Description>
        : null}
      </Alert.Content>
    </Alert>
  : <Alert type="warning">
      <Alert.Icon />
      <Alert.Content>
        <Alert.Content.Title className="font-bold">Inte utbetald ännu</Alert.Content.Title>
        <Alert.Content.Description>
          Ingen verkställd Lifecare-utbetalning för ansökningsmånaden.
        </Alert.Content.Description>
      </Alert.Content>
    </Alert>;

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
  const { status, isLoading, error, refresh } = useErrandPayment(errandId);

  const renderStatus = (): ReactNode => {
    if (isLoading) {
      return (
        <div className="flex justify-center my-32">
          <Spinner size={4} />
        </div>
      );
    }
    if (error || !status) {
      return <p className="m-0">Det gick inte att hämta utbetalningsstatus ({String(error ?? 'okänt fel')})</p>;
    }
    return (
      <>
        <LabeledValue label="Avser ansökan">{formatApplicationMonth(status.applicationMonth)}</LabeledValue>
        <PaymentStatusAlert status={status} />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-24">
      <ErrandSectionHeader
        title="Utbetalning"
        description="Visar om utbetalningen för ansökningsmånaden är verkställd i Lifecare. Själva utbetalningen görs i Lifecare."
        action={headerSlot}
      >
        {locked ?
          <LockedBanner />
        : null}
      </ErrandSectionHeader>

      <ContentBox
        title="Utbetalningsstatus"
        action={
          <Button size="sm" variant="tertiary" leftIcon={<RotateCcw />} disabled={isLoading} onClick={refresh}>
            Uppdatera
          </Button>
        }
      >
        {renderStatus()}
      </ContentBox>
    </div>
  );
};
