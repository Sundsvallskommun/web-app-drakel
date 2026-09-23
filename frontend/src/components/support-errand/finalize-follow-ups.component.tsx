'use client';

import { Alert } from '@sk-web-gui/alert';
import { FinalizeFollowUp } from '@utils/finalize-follow-ups';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Shown once "Besluta och utbetala" has decided the errand but some part after that did not go through —
 * the errand cannot be finalized again, so these are things the handläggare has to follow up by hand.
 */
export const FinalizeFollowUps: FC<{ followUps: FinalizeFollowUp[] }> = ({ followUps }) => {
  const { t } = useTranslation('errand');

  return (
    <Alert type="warning">
      <Alert.Icon />
      <Alert.Content>
        <Alert.Content.Title className="font-bold">{t('decideAndPay.done.title')}</Alert.Content.Title>
        <Alert.Content.Description>
          <p className="m-0">{t('decideAndPay.done.description')}</p>
          <ul className="m-0 mt-8 pl-20 list-disc">
            {followUps.map((followUp) => (
              <li key={`${followUp.key}-${followUp.detail ?? ''}`}>
                {t(`decideAndPay.done.${followUp.key}`, {
                  detail: followUp.detail,
                  interpolation: { escapeValue: false },
                })}
              </li>
            ))}
          </ul>
        </Alert.Content.Description>
      </Alert.Content>
    </Alert>
  );
};
