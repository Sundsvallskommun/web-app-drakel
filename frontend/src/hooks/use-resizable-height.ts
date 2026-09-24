'use client';

import { PointerEvent as ReactPointerEvent, useCallback, useState } from 'react';

interface ResizableHeight {
  height: number;
  /** Put on the drag handle's onPointerDown: dragging it up makes the element taller, down makes it lower. */
  startResize: (event: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * The height of an element pinned to the bottom of the screen, resized by dragging a handle on its top edge.
 * The height stays between `min` and `maxShareOfScreen` of the window's height.
 */
export const useResizableHeight = (initial: number, min: number, maxShareOfScreen: number): ResizableHeight => {
  const [height, setHeight] = useState<number>(initial);

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = height;
      const onMove = (move: PointerEvent): void => {
        const max = window.innerHeight * maxShareOfScreen;
        setHeight(Math.min(max, Math.max(min, startHeight + startY - move.clientY)));
      };
      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [height, min, maxShareOfScreen]
  );

  return { height, startResize };
};
