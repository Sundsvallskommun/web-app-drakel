'use client';

import { useSsbtekPanel } from '@components/ssbtek/ssbtek-panel-context';
import { useUserStore } from '@services/user-service/user-service';
import { Button, Logo, UserMenu } from '@sk-web-gui/react';
import { basePath } from '@utils/base-path';
import { getInitials } from '@utils/get-initials';
import { ExternalLink, FileSearch } from 'lucide-react';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { HeaderNotifications } from './header-notifications.component';
import { useUserMenuGroups } from './user-menu-groups';

/**
 * Dark top header for the errand/register pages: service logo, "Hämta från SSBTEK", "Nytt ärende", notifications
 * and user menu.
 */
export const AppHeader = () => {
  const { t } = useTranslation('header');
  const user = useUserStore(useShallow((state) => state.user));
  const userMenuGroups = useUserMenuGroups();
  const ssbtekPanel = useSsbtekPanel();
  const { locale } = useParams<{ locale: string }>();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Drakel';

  // relative z-20 keeps the header above the errand view's administration bar (z-10), so the user menu and
  // notification panels open over it rather than behind it.
  return (
    <header className="shrink-0 relative z-20 bg-gray-600 border-b-1 border-divider px-24 py-12 flex items-center justify-between gap-40">
      <NextLink href={`/${locale}/oversikt`} className="no-underline min-w-0" aria-label={t('logoLink')}>
        <Logo variant="service" inverted title="Drakel" subtitle={appName} />
      </NextLink>

      <div className="flex items-center gap-24 shrink-0">
        <div className="flex items-center gap-12">
          {/* Öppnar/stänger SSBTEK-panelen längst ner på sidan. */}
          <Button
            color="vattjom"
            inverted
            variant="secondary"
            leftIcon={<FileSearch />}
            aria-pressed={ssbtekPanel.isOpen}
            onClick={ssbtekPanel.toggle}
          >
            {t('ssbtek')}
          </Button>
          {/* Registrering skapar ett utkast direkt, så det öppnas i en ny flik för att inte lämna pågående ärende. */}
          <Button
            color="vattjom"
            inverted
            rightIcon={<ExternalLink />}
            onClick={() => {
              window.open(`${basePath}/${locale}/registrera`, '_blank', 'noopener');
            }}
          >
            {t('newErrand')}
          </Button>
        </div>

        <HeaderNotifications />

        <div className="flex items-center gap-12">
          <span className="hidden md:flex flex-col text-light-primary leading-tight">
            <span className="font-bold">{user.name}</span>
            <span className="text-small text-light-secondary">{user.username}</span>
          </span>
          <UserMenu
            data-cy="usermenu"
            initials={getInitials(user.name)}
            menuTitle={`${user.name} (${user.username})`}
            menuGroups={userMenuGroups}
            buttonRounded={false}
            buttonSize="sm"
          />
        </div>
      </div>
    </header>
  );
};
