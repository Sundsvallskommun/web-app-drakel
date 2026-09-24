'use client';

import { Button } from '@sk-web-gui/react';
import { basePath } from '@utils/base-path';
import { ExternalLink, FileSearch } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useSsbtekPanel } from './ssbtek-panel-context';
import { useSsbtekPreference } from './ssbtek-preference-context';

/**
 * "Hämta från SSBTEK" in the header, beside "Nytt ärende". Shown only on an errand — SSBTEK is read for the
 * errand's sökande — and not on the SSBTEK page itself. Opens the SSBTEK page in a new tab, or the panel at the
 * foot of the errand, as the handläggare has chosen in the user menu (kept in their settings in careM).
 */
export const SsbtekButton: FC = () => {
  const { t } = useTranslation('header');
  const { locale, errandId } = useParams<{ locale: string; errandId?: string }>();
  const pathname = usePathname();
  const { openInNewTab } = useSsbtekPreference();
  const panel = useSsbtekPanel();

  if (!errandId || pathname.endsWith('/ssbtek')) {
    return null;
  }

  if (!openInNewTab) {
    return (
      <Button
        color="vattjom"
        inverted
        variant="secondary"
        leftIcon={<FileSearch />}
        aria-pressed={panel.isOpen}
        onClick={panel.toggle}
      >
        {t('ssbtek')}
      </Button>
    );
  }

  return (
    <Button
      color="vattjom"
      inverted
      variant="secondary"
      leftIcon={<FileSearch />}
      rightIcon={<ExternalLink />}
      onClick={() => {
        window.open(`${basePath}/${locale}/arende/${encodeURIComponent(errandId)}/ssbtek`, '_blank', 'noopener');
      }}
    >
      {t('ssbtek')}
    </Button>
  );
};
