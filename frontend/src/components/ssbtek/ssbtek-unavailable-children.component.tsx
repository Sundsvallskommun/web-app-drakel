'use client';

import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Says which of the ansökan's children SSBTEK could not be read for — their payments are not listed. Nothing when
 * every child was read.
 */
export const SsbtekUnavailableChildren: FC<{ names: string[] }> = ({ names }) => {
  const { t } = useTranslation('ssbtek');
  if (names.length === 0) {
    return null;
  }
  const children = names.map((name) => name || t('persons.unnamedChild')).join(', ');
  return <p className="text-warning-surface-primary m-0">{t('unavailableChildren', { children })}</p>;
};
