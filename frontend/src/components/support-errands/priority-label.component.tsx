import { FC } from 'react';

// Literal class names (not constructed) so Tailwind keeps them.
const priorityConfig = (priority?: string): { dot: string; label: string } => {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
      return { dot: 'bg-error-surface-primary', label: 'Hög' };
    case 'MEDIUM':
      return { dot: 'bg-warning-surface-primary', label: 'Medel' };
    case 'LOW':
      return { dot: 'bg-gronsta-surface-primary', label: 'Låg' };
    default:
      return { dot: 'bg-gray-300', label: priority ?? '—' };
  }
};

/** Priority as a coloured dot + Swedish label, mirroring draken's overview. */
export const PriorityLabel: FC<{ priority?: string }> = ({ priority }) => {
  const { dot, label } = priorityConfig(priority);
  return (
    <span className="flex items-center gap-8 whitespace-nowrap">
      <span className={`inline-block w-10 h-10 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
};
