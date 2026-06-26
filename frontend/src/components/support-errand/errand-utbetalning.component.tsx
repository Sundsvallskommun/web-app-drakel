'use client';

import { useErrandPayment } from '@hooks/use-errand-payment';
import { Alert } from '@sk-web-gui/alert';
import { Button, FormLabel, Spinner } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { RotateCcw } from 'lucide-react';
import { FC, ReactNode } from 'react';

/**
 * "Utbetalning" tab — reads whether the Lifecare utbetalning for the errand's application month has
 * been effectuated (caremanagement payment-status). Read-only; the actual utbetalning happens in
 * Lifecare.
 */
export const ErrandUtbetalning: FC<{ errandId: string; headerSlot?: ReactNode }> = ({ errandId, headerSlot }) => {
  const { status, isLoading, error, refresh } = useErrandPayment(errandId);

  if (isLoading) {
    return (
      <div className="flex justify-center my-32">
        <Spinner size={4} />
      </div>
    );
  }

  if (error || !status) {
    return <p className="my-24">Det gick inte att hämta utbetalningsstatus ({String(error ?? 'okänt fel')})</p>;
  }

  return (
    <div className="flex flex-col gap-24 max-w-[40rem]">
      <div className="flex items-center justify-between gap-12 flex-wrap">
        <h2 className="text-h3-sm md:text-h3-md m-0">Utbetalning</h2>
        <Button size="sm" variant="tertiary" leftIcon={<RotateCcw />} onClick={refresh}>
          Uppdatera
        </Button>
      </div>
      {headerSlot}

      <div className="flex flex-col gap-2">
        <FormLabel className="text-small">Avser ansökan</FormLabel>
        <span className="font-bold">{formatApplicationMonth(status.applicationMonth)}</span>
      </div>

      {status.unavailable ?
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
        </Alert>
      }
    </div>
  );
};
