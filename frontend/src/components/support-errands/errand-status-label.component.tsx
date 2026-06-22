import { Label } from '@sk-web-gui/react';
import { ComponentProps, FC } from 'react';

type LabelColor = ComponentProps<typeof Label>['color'];

/**
 * caremanagement statuses are namespace-defined (the STATUS metadata lookups), so we can't rely on
 * a fixed enum. We colour a few common intents and fall back to a neutral label for everything else,
 * always showing the raw status text.
 */
const statusColor = (status: string): LabelColor => {
  switch (status.toUpperCase()) {
    case 'NEW':
    case 'NYA':
      return 'vattjom';
    case 'ONGOING':
    case 'UNDER_ARBETE':
      return 'gronsta';
    case 'PENDING':
    case 'AWAITING':
      return 'warning';
    case 'SOLVED':
    case 'CLOSED':
      return 'primary';
    default:
      return 'tertiary';
  }
};

export const ErrandStatusLabel: FC<{ status?: string }> = ({ status }) => {
  if (!status) {
    return null;
  }
  return (
    <Label rounded color={statusColor(status)} className="max-h-full h-auto text-center whitespace-nowrap">
      {status}
    </Label>
  );
};
