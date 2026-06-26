'use client';

import { useErrandPayment } from '@hooks/use-errand-payment';
import { Button, cx, FormLabel, Spinner } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { CheckCircle2, Clock, HelpCircle, RotateCcw } from 'lucide-react';
import { FC, ReactNode } from 'react';

const StatusBox: FC<{ tone: 'success' | 'pending' | 'unknown'; icon: ReactNode; title: string; detail?: string }> = ({
  tone,
  icon,
  title,
  detail,
}) => (
  <div
    className={cx(
      'flex items-start gap-12 rounded-12 border-1 p-16',
      tone === 'success' && 'border-success-surface-primary bg-success-background-100',
      tone === 'pending' && 'border-warning-surface-primary bg-warning-background-100',
      tone === 'unknown' && 'border-gray-300 bg-gray-100'
    )}
  >
    <span
      className={cx(
        'shrink-0 mt-2',
        tone === 'success' && 'text-success-surface-primary',
        tone === 'pending' && 'text-warning-surface-primary',
        tone === 'unknown' && 'text-gray-500'
      )}
    >
      {icon}
    </span>
    <div className="flex flex-col gap-2">
      <span className="font-bold">{title}</span>
      {detail ? <span className="text-small text-dark-secondary">{detail}</span> : null}
    </div>
  </div>
);

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
        <StatusBox
          tone="unknown"
          icon={<HelpCircle size={20} />}
          title="Utbetalningsstatus är inte tillgänglig"
          detail="Status hämtas från Lifecare och kunde inte läsas just nu. Försök igen senare."
        />
      : status.effectuated ?
        <StatusBox
          tone="success"
          icon={<CheckCircle2 size={20} />}
          title="Utbetald"
          detail={status.paymentDate ? `Utbetalningsdatum: ${status.paymentDate}` : undefined}
        />
      : <StatusBox
          tone="pending"
          icon={<Clock size={20} />}
          title="Inte utbetald ännu"
          detail="Ingen verkställd Lifecare-utbetalning för ansökningsmånaden."
        />
      }
    </div>
  );
};
