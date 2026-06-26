'use client';

import { Alert } from '@sk-web-gui/alert';
import { FC, ReactNode } from 'react';

/** The "section approved and locked" banner — a green success Alert shown above a locked section. */
export const LockedBanner: FC = () => (
  <Alert type="success">
    <Alert.Icon />
    <Alert.Content>
      <Alert.Content.Title>
        Sektionen är godkänd och låst för redigering. Avmarkera godkännandet för att redigera igen.
      </Alert.Content.Title>
    </Alert.Content>
  </Alert>
);

/**
 * Disables every input/select/button inside while keeping the content fully visible and scrollable, so an
 * approved section stays readable. NOTE: a disabled `<fieldset>` also disables any tab buttons nested
 * inside it — wrap only the editable content, never a tab navigation row, or the tabs become unclickable.
 * For a tabbed section, render {@link LockedBanner} once and apply this per tab panel (not around the Tabs).
 */
export const LockFieldset: FC<{ locked: boolean; children: ReactNode }> = ({ locked, children }) => (
  <fieldset disabled={locked} className="border-0 p-0 m-0 min-w-0">
    {children}
  </fieldset>
);
