'use client';

import { useUserStore } from '@services/user-service/user-service';
import { cx } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

/** The pages of the admin section, in the order the navigation lists them. */
const ADMIN_PAGES = [
  { slug: 'mallar', labelKey: 'nav.templates' },
  { slug: 'loggar', labelKey: 'nav.logs' },
];

/**
 * Frame around the /admin pages: the permission gate, the section heading and the navigation between the
 * pages.
 *
 * The gate sits here rather than in each page so a page cannot be added without one. It only keeps the
 * section from rendering controls that would be refused — the backend requires the same permission on
 * every endpoint behind it, which is what actually protects the data.
 */
export const AdminSection: FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation('admin');
  const user = useUserStore(useShallow((state) => state.user));
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();

  if (!user.permissions.canAdminister) {
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

      <nav aria-label={t('nav.label')}>
        <ul className="m-0 flex list-none flex-wrap gap-8 p-0">
          {ADMIN_PAGES.map((page) => {
            const href = `/${locale}/admin/${page.slug}`;
            // endsWith rather than equality: the pathname carries the base path in a deployed app.
            const isActive = pathname.endsWith(`/admin/${page.slug}`);
            return (
              <li key={page.slug}>
                <NextLink
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cx(
                    'inline-block rounded-12 px-16 py-10 no-underline transition-colors',
                    isActive ?
                      'bg-vattjom-surface-primary text-light-primary font-bold'
                    : 'bg-background-content text-dark-primary hover:bg-background-color-mixin-1'
                  )}
                >
                  {t(page.labelKey)}
                </NextLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {children}
    </main>
  );
};
