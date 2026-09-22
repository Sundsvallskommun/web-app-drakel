'use client';

import { Alert } from '@sk-web-gui/alert';
import { cx } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/** The "section approved and locked" banner — a green success Alert shown above a locked section. */
export const LockedBanner: FC = () => {
  const { t } = useTranslation('errand');
  return (
    <Alert type="success">
      <Alert.Icon />
      <Alert.Content>
        <Alert.Content.Title>{t('lockedBanner')}</Alert.Content.Title>
      </Alert.Content>
    </Alert>
  );
};

/**
 * Disables every input/select/button inside while keeping the content fully visible and scrollable, so an
 * approved section stays readable.
 *
 * A locked section is also muted. Disabled fields on their own still read as fields waiting to be filled
 * in, and a handläggare who has marked a section complete should be able to see at a glance that it is
 * done rather than discover it by clicking. The fade is kept light: the numbers underneath are the point
 * of the section and still have to be readable.
 *
 * Controls marked `data-lock-hides` are taken away entirely rather than faded — a row's delete button, in
 * particular. A greyed-out papperskorg still says "this row can be removed", which is the opposite of what
 * a completed calculation means. The rule lives here so a locked section cannot keep one by oversight.
 *
 * NOTE: a disabled `<fieldset>` also disables any tab buttons nested inside it — wrap only the editable
 * content, never a tab navigation row, or the tabs become unclickable. For a tabbed section, render
 * {@link LockedBanner} once and apply this per tab panel (not around the Tabs).
 */
export const LockFieldset: FC<{ locked: boolean; children: ReactNode }> = ({ locked, children }) => (
  <fieldset
    disabled={locked}
    className={cx('border-0 p-0 m-0 min-w-0', locked && 'opacity-70 grayscale [&_[data-lock-hides]]:hidden')}
  >
    {children}
  </fieldset>
);
