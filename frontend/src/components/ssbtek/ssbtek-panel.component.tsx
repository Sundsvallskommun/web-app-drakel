'use client';

import { useResizableHeight } from '@hooks/use-resizable-height';
import { Button } from '@sk-web-gui/react';
import { X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useSsbtekPanel } from './ssbtek-panel-context';
import { SsbtekPayments } from './ssbtek-payments.component';

// The panel opens a third of the way up and is dragged between a strip and most of the screen.
const INITIAL_HEIGHT = 360;
const MIN_HEIGHT = 160;
const MAX_SHARE_OF_SCREEN = 0.85;

/**
 * SSBTEK opened on the errand itself (when the handläggare prefers that to a new tab): a panel pinned to the foot
 * of the page, across the whole width up to the right-hand sidebar (whose width the errand view publishes as
 * `--errand-sidebar-width`), resized by dragging its top edge. It shows the same payments as the SSBTEK page.
 */
export const SsbtekPanel: FC = () => {
  const { t } = useTranslation('ssbtek');
  const { errandId } = useParams<{ errandId?: string }>();
  const { isOpen, close } = useSsbtekPanel();
  const { height, startResize } = useResizableHeight(INITIAL_HEIGHT, MIN_HEIGHT, MAX_SHARE_OF_SCREEN);

  if (!isOpen || !errandId) {
    return null;
  }

  return (
    <section
      aria-label={t('title')}
      className="fixed bottom-0 left-0 z-30 flex flex-col bg-background-content border-t-1 border-divider shadow-100"
      style={{ height, right: 'var(--errand-sidebar-width, 0px)' }}
    >
      {/* The drag handle: the panel's top edge. */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={t('resize')}
        className="h-12 shrink-0 cursor-row-resize flex items-center justify-center hover:bg-background-200"
        onPointerDown={startResize}
      >
        <span className="block w-48 h-4 rounded-full bg-dark-disabled" />
      </div>

      <div className="flex items-center justify-between gap-16 px-24 pb-12 shrink-0">
        <h2 className="text-h4-sm m-0">{t('title')}</h2>
        <Button size="sm" variant="tertiary" iconButton aria-label={t('close')} leftIcon={<X />} onClick={close} />
      </div>

      <div className="grow min-h-0 overflow-y-auto px-24 pb-24">
        <SsbtekPayments errandId={errandId} />
      </div>
    </section>
  );
};
