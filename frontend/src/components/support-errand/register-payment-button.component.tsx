'use client';

import { PaymentRegistrationOutcomeEnum } from '@data-contracts/backend/data-contracts';
import { registerPaymentInLifecare } from '@services/payment-service';
import { Button } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Registers an utbetalning that is still waiting (PENDING_REGISTRATION) in Lifecare. It waits when the
 * BFF could not vouch for it when the errand was decided — most often because the beslut was not in
 * Lifecare yet, so the insats had no balance to pay from. Why it did not go through this time is shown
 * as it came, since the handläggare has to act on it.
 */
export const RegisterPaymentButton: FC<{ errandId: string; paymentId: string; onRegistered: () => void }> = ({
  errandId,
  paymentId,
  onRegistered,
}) => {
  const { t } = useTranslation('decision');
  const [working, setWorking] = useState<boolean>(false);
  const [reason, setReason] = useState<string>();

  const register = async (): Promise<void> => {
    setWorking(true);
    setReason(undefined);
    const result = await registerPaymentInLifecare(errandId, paymentId);
    setWorking(false);
    if (result.error || !result.data) {
      setReason(result.message ?? t('payment.list.registerError'));
      return;
    }
    if (result.data.detail) {
      setReason(result.data.detail);
    }
    // A registration and a refusal both change the row careM holds, so the list is read again for either.
    if (result.data.outcome !== PaymentRegistrationOutcomeEnum.NOT_SENT) {
      onRegistered();
    }
  };

  return (
    <span className="flex flex-col items-start gap-4">
      <Button size="sm" variant="secondary" loading={working} onClick={() => void register()}>
        {t('payment.list.register')}
      </Button>
      {reason ?
        <span className="text-small text-error-surface-primary">{reason}</span>
      : null}
    </span>
  );
};
