'use client';

import { useUserStore } from '@services/user-service/user-service';
import { cx, Spinner } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { ADMIN_PAGES, permittedAdminPages } from './admin-pages';

/**
 * Frame around the /admin pages: the permission gate, the section heading and the navigation.
 *
 * The gate sits here rather than in each page so a page cannot be added without one, and it is checked
 * per page: the two halves of the section are granted by separate AD groups, so reaching one says nothing
 * about the other. The navigation lists only the pages the user may open — offering a link that answers
 * "no access" would read as a fault rather than as a boundary.
 *
 * This only keeps the section from rendering controls that would be refused. The backend requires the
 * matching permission on every endpoint behind it, which is what actually protects the data.
 */
export const AdminSection: FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation('admin');
  const user = useUserStore(useShallow((state) => state.user));
  const permissions = user.permissions;
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();

  const pages = permittedAdminPages(permissions);
  // endsWith rather than equality: the pathname carries the base path in a deployed app.
  const isCurrent = (slug: string): boolean => pathname.endsWith(`/admin/${slug}`);
  const openPage = ADMIN_PAGES.find((page) => isCurrent(page.slug));
  const mayOpenCurrent = openPage === undefined || permissions[openPage.permission];

  // The user is loaded after mount, and until then every permission reads false — announcing "no access"
  // in that gap would tell an administrator they had been locked out.
  if (user.username === '') {
    return (
      <main className="flex justify-center p-24">
        <Spinner size={4} />
      </main>
    );
  }

  if (pages.length === 0 || !mayOpenCurrent) {
    return (
      <main className="mx-auto w-full max-w-[120rem] p-24">
        <h1 className="text-h2-md">{t('title')}</h1>
        <p className="text-dark-secondary">{t('noAccess')}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[120rem] flex-col gap-24 overflow-y-auto p-24">
      <h1 className="m-0 text-h2-md">{t('title')}</h1>

      {/* A single page needs no navigation — the heading already says where the user is. */}
      {pages.length > 1 ?
        <nav aria-label={t('nav.label')}>
          <ul className="m-0 flex list-none flex-wrap gap-8 p-0">
            {pages.map((page) => (
              <li key={page.slug}>
                <NextLink
                  href={`/${locale}/admin/${page.slug}`}
                  aria-current={isCurrent(page.slug) ? 'page' : undefined}
                  className={cx(
                    'inline-block rounded-12 px-16 py-10 no-underline transition-colors',
                    isCurrent(page.slug) ?
                      'bg-vattjom-surface-primary text-light-primary font-bold'
                    : 'bg-background-content text-dark-primary hover:bg-background-color-mixin-1'
                  )}
                >
                  {t(page.labelKey)}
                </NextLink>
              </li>
            ))}
          </ul>
        </nav>
      : null}

      {children}
    </main>
  );
};
