'use client';

import { SectionApproval } from '@services/section-approval-service';
import { Checkbox } from '@sk-web-gui/react';
import { FC } from 'react';

/**
 * A "godkänn sektion" checkbox shown beneath an EB view (Normberäkning / Utbetalning / Beslut). Bound
 * to the section's approval state; shows who approved it and when once ticked.
 */
export const SectionApprovalCheckbox: FC<{
  label: string;
  approval?: SectionApproval;
  disabled?: boolean;
  onChange: (approved: boolean) => void;
}> = ({ label, approval, disabled, onChange }) => (
  <div className="flex flex-col gap-2 rounded-12 border-1 border-divider bg-background-200 p-16">
    <Checkbox
      checked={approval?.approved ?? false}
      disabled={disabled}
      onChange={(event) => {
        onChange(event.target.checked);
      }}
    >
      {label}
    </Checkbox>
    {approval?.approved && approval.approvedBy ?
      <span className="text-small text-dark-secondary ml-28">
        Godkänd av {approval.approvedBy}
        {approval.approvedAt ? ` · ${approval.approvedAt.slice(0, 10)}` : ''}
      </span>
    : null}
  </div>
);
