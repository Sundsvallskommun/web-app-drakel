'use client';

import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { RecordBodyText } from './record-body-text.component';

/**
 * A Lifecare record's text inside its card. The bodies arrive after the list, so a card says so while
 * they load, and says so when Lifecare would not hand this one over.
 */
export const LifecareRecordBody: FC<{ content?: string; isLoading: boolean; unreadable: boolean }> = ({
  content,
  isLoading,
  unreadable,
}) => {
  const { t } = useTranslation('documentation');

  if (content) {
    return <RecordBodyText text={content} />;
  }
  if (isLoading) {
    return <p className="m-0 text-small italic">{t('lifecare.bodyLoading')}</p>;
  }
  if (unreadable) {
    return <p className="m-0 text-small italic">{t('lifecare.bodyUnreadable')}</p>;
  }
  return null;
};
