'use client';

import { cx } from '@sk-web-gui/react';
import { Lock } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * "Du har bara läsbehörighet" — shown where the write actions would otherwise be, for a handläggare who may only
 * read errands, so the missing actions are not a mystery.
 */
export const ReadOnlyNotice: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation('common');
  return (
    <p className={cx('m-0 flex items-center gap-8 text-small text-dark-secondary', className)} role="status">
      <Lock size={16} aria-hidden />
      {t('readOnly')}
    </p>
  );
};
