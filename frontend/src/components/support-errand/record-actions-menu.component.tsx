'use client';

import { Button, PopupMenu } from '@sk-web-gui/react';
import { Ellipsis } from 'lucide-react';
import { FC, ReactElement } from 'react';

export interface RecordAction {
  label: string;
  icon: ReactElement;
  onClick: () => void;
}

interface RecordActionsMenuProps {
  /** Used in the menu button's accessible name, e.g. the record's heading. */
  recordLabel?: string;
  actions: RecordAction[];
  /** Shows a spinner on the menu button while an action is in progress. */
  loading?: boolean;
}

/** The "…" menu on a record card holding its per-record actions; renders nothing without actions. */
export const RecordActionsMenu: FC<RecordActionsMenuProps> = ({ recordLabel, actions, loading }) => {
  if (actions.length === 0) {
    return null;
  }
  return (
    // The PopupMenu panel is positioned absolutely, so it needs a `relative` ancestor to anchor to.
    <div className="relative">
      <PopupMenu position="under" align="end">
        <PopupMenu.Button
          variant="tertiary"
          showBackground={false}
          size="sm"
          iconButton
          loading={loading}
          aria-label={recordLabel ? `Åtgärder för ${recordLabel}` : 'Åtgärder'}
        >
          <Ellipsis />
        </PopupMenu.Button>
        <PopupMenu.Panel>
          <PopupMenu.Items>
            {actions.map((action) => (
              <PopupMenu.Item key={action.label}>
                <Button leftIcon={action.icon} onClick={action.onClick}>
                  {action.label}
                </Button>
              </PopupMenu.Item>
            ))}
          </PopupMenu.Items>
        </PopupMenu.Panel>
      </PopupMenu>
    </div>
  );
};
