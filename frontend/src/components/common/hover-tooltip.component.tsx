'use client';

import { cx, Tooltip } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';

type TooltipPosition = 'above' | 'below' | 'left' | 'right';

// Anchor the (absolutely positioned) tooltip relative to the trigger for each direction.
const WRAPPER_POSITION: Record<TooltipPosition, string> = {
  left: 'right-full top-1/2 -translate-y-1/2',
  right: 'left-full top-1/2 -translate-y-1/2',
  above: 'bottom-full left-1/2 -translate-x-1/2',
  below: 'top-full left-1/2 -translate-x-1/2',
};

interface HoverTooltipProps {
  /** The text shown in the tooltip bubble. */
  label: ReactNode;
  position?: TooltipPosition;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps a trigger and reveals an sk-web-gui label tooltip on hover/focus. The bubble is absolutely
 * positioned (no layout shift) and only rendered visible while hovering or keyboard-focused.
 */
export const HoverTooltip: FC<HoverTooltipProps> = ({ label, position = 'below', className, children }) => (
  <span className={cx('group relative inline-flex', className)}>
    {children}
    <span
      className={cx(
        'pointer-events-none absolute z-20 hidden whitespace-nowrap group-hover:block group-focus-within:block',
        WRAPPER_POSITION[position]
      )}
    >
      <Tooltip position={position}>{label}</Tooltip>
    </span>
  </span>
);
