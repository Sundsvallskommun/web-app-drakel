import { Label } from '@sk-web-gui/react';
import { errandStatusLabel } from '@utils/errand-status';
import { ComponentProps, FC } from 'react';

type LabelColor = ComponentProps<typeof Label>['color'];

/**
 * Badge colour by intent for the financial-assistance errand statuses. Unknown statuses fall back to a neutral
 * label showing the raw status text.
 */
const STATUS_COLORS: Record<string, LabelColor> = {
  RECEIVED: 'vattjom',
  NEEDS_MANUAL_REVIEW: 'warning',
  UNDER_REVIEW: 'vattjom',
  SUPPLEMENT_REQUESTED: 'warning',
  AWAITING_DECISION: 'warning',
  GRANTED: 'gronsta',
  REJECTED: 'error',
  PAID: 'gronsta',
  WITHDRAWN: 'tertiary',
  CLOSED: 'primary',
};

export const ErrandStatusLabel: FC<{ status?: string }> = ({ status }) => {
  if (!status) {
    return null;
  }
  return (
    <Label
      rounded
      color={STATUS_COLORS[status.toUpperCase()] ?? 'tertiary'}
      className="max-h-full h-auto text-center whitespace-nowrap"
    >
      {errandStatusLabel(status)}
    </Label>
  );
};
