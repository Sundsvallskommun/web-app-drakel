import { Label } from '@sk-web-gui/react';
import { ComponentProps, FC } from 'react';

type LabelColor = ComponentProps<typeof Label>['color'];

/**
 * The financial-assistance errand statuses (the STATUS metadata lookups). Each maps to its Swedish
 * display name and a badge colour by intent. Unknown statuses fall back to a neutral label showing the
 * raw status text.
 */
const STATUS_META: Record<string, { label: string; color: LabelColor }> = {
  RECEIVED: { label: 'Inkommen', color: 'vattjom' },
  NEEDS_MANUAL_REVIEW: { label: 'Kräver manuell granskning', color: 'warning' },
  UNDER_REVIEW: { label: 'Under utredning', color: 'vattjom' },
  SUPPLEMENT_REQUESTED: { label: 'Komplettering begärd', color: 'warning' },
  AWAITING_DECISION: { label: 'Väntar på beslut', color: 'warning' },
  GRANTED: { label: 'Beviljad', color: 'gronsta' },
  REJECTED: { label: 'Avslagen', color: 'error' },
  PAID: { label: 'Utbetald', color: 'gronsta' },
  WITHDRAWN: { label: 'Återtagen', color: 'tertiary' },
  CLOSED: { label: 'Avslutad', color: 'primary' },
};

export const ErrandStatusLabel: FC<{ status?: string }> = ({ status }) => {
  if (!status) {
    return null;
  }
  const meta = STATUS_META[status.toUpperCase()];
  return (
    <Label
      rounded
      color={meta?.color ?? 'tertiary'}
      className="max-h-full h-auto text-center whitespace-nowrap"
    >
      {meta?.label ?? status}
    </Label>
  );
};
