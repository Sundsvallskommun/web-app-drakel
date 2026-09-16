'use client';

import { FC } from 'react';
import { useTranslation } from 'react-i18next';

// Literal class names (not constructed) so Tailwind keeps them.
const priorityDotClass = (priority?: string): string => {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
      return 'bg-error-surface-primary';
    case 'MEDIUM':
      return 'bg-warning-surface-primary';
    case 'LOW':
      return 'bg-vattjom-surface-primary';
    default:
      return 'bg-gray-300';
  }
};

/** Priority as a coloured dot + translated label, mirroring draken's overview. */
export const PriorityLabel: FC<{ priority?: string }> = ({ priority }) => {
  const { t } = useTranslation();
  const label =
    priority ? t(`common:priority.${priority.toUpperCase()}`, { defaultValue: priority }) : t('common:none');
  return (
    <span className="flex items-center gap-8 whitespace-nowrap">
      <span className={`inline-block w-10 h-10 rounded-full ${priorityDotClass(priority)}`} aria-hidden />
      {label}
    </span>
  );
};
