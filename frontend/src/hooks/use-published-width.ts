'use client';

import { RefObject, useEffect } from 'react';

/**
 * Publishes an element's width as a CSS custom property on the document root while it is mounted, so something
 * elsewhere in the tree (e.g. a panel fixed to the foot of the page) can line up with it. Removed on unmount.
 */
export const usePublishedWidth = (elementRef: RefObject<HTMLElement | null>, propertyName: string): void => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }
    const rootStyle = document.documentElement.style;
    const publish = (): void => {
      rootStyle.setProperty(propertyName, `${element.offsetWidth.toString()}px`);
    };
    publish();
    // jsdom (tests) has no ResizeObserver; the first measurement is enough there.
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(publish);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      rootStyle.removeProperty(propertyName);
    };
  }, [elementRef, propertyName]);
};
