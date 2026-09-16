'use client';

import { RecordSource } from '@interfaces/record-source';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/** "Från Lifecare" badge for records imported from Lifecare; renders nothing for Draken-authored ones. */
export const LifecareSourceBadge: FC<{ source?: RecordSource }> = ({ source }) => {
  const { t } = useTranslation('errand');
  return source === 'LIFECARE' ?
      <span className="shrink-0 text-small rounded-8 px-8 py-2 bg-vattjom-background-200 text-vattjom-text-primary">
        {t('lifecareSourceBadge')}
      </span>
    : null;
};
