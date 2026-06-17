'use client';

import { ErrandStatusLabel } from '@components/support-errands/errand-status-label.component';
import { useUserStore } from '@services/user-service/user-service';
import { Button, Divider, Logo, UserMenu } from '@sk-web-gui/react';
import { getInitials } from '@utils/get-initials';
import { ExternalLink } from 'lucide-react';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import { useErrandHeader } from './errand-header-context';
import { userMenuGroups } from './user-menu-groups';

const EMPTY_ERRAND_TITLE = 'Empty errand';

/** Slim top header for the errand/register pages (draken look): brand, user menu, "new errand".
 *  On an errand page it shows the errand's status + title instead of the full brand logo. */
export const AppHeader = () => {
  const user = useUserStore(useShallow((state) => state.user));
  const { errand } = useErrandHeader();
  const { locale } = useParams<{ locale: string }>();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Drakel';

  return (
    <nav className="shrink-0 bg-background-content border-b-1 border-divider px-24 md:px-40 py-8 flex items-center justify-between gap-16">
      {errand ?
        <div className="flex items-center gap-16 min-w-0">
          <NextLink href={`/${locale}/oversikt`} className="no-underline shrink-0" aria-label="Till översikten">
            <Logo variant="symbol" className="h-32" />
          </NextLink>
          <ErrandStatusLabel status={errand.status} />
          <span className="flex min-w-0 flex-col">
            <span className="font-bold truncate">
              {errand.title && errand.title !== EMPTY_ERRAND_TITLE ? errand.title : 'Nytt ärende'}
            </span>
            {errand.errandNumber ?
              <span className="text-small text-secondary truncate">{errand.errandNumber}</span>
            : null}
          </span>
        </div>
      : <NextLink href={`/${locale}/oversikt`} className="no-underline" aria-label="Till översikten">
          <Logo variant="service" title="Drakel" subtitle={appName} />
        </NextLink>
      }

      <div className="flex items-center gap-16 shrink-0">
        <UserMenu
          data-cy="usermenu"
          initials={getInitials(user.name)}
          menuTitle={`${user.name} (${user.username})`}
          menuGroups={userMenuGroups}
          buttonRounded={false}
          buttonSize="sm"
        />
        <Divider orientation="vertical" className="h-32" />
        <NextLink href={`/${locale}/registrera`} data-cy="register-new-errand-button">
          <Button color="vattjom" variant="tertiary" rightIcon={<ExternalLink />}>
            Nytt ärende
          </Button>
        </NextLink>
      </div>
    </nav>
  );
};
