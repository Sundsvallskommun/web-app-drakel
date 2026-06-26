'use client';

import { SectionApproval } from '@services/section-approval-service';
import { Checkbox } from '@sk-web-gui/react';
import { FC } from 'react';

/**
 * A "markera som klart" checkbox shown under an EB view's heading (Normberäkning / Utbetalning /
 * Beslut). Bound to the section's approval state; shows who approved it and when once ticked.
 */
export const SectionApprovalCheckbox: FC<{
  label: string;
  approval?: SectionApproval;
  disabled?: boolean;
  onChange: (approved: boolean) => void;
}> = ({ label, approval, disabled, onChange }) => (
  <div className="flex flex-col gap-2 w-fit">
    <Checkbox
      checked={approval?.approved ?? false}
      disabled={disabled}
      onChange={(event) => {
        onChange(event.target.checked);
      }}
    >
      {label}
    </Checkbox>
  </div>
);
