'use client';

import { useUserStore } from '@services/user-service/user-service';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { permittedAdminPages } from './admin-pages';

/**
 * /admin itself has no content — it opens on the first page the user may reach.
 *
 * Which one that is depends on their AD groups, so the choice cannot be made on the server: someone who
 * only follows up logs would be sent to a mallhantering they are not allowed to open. The gate in
 * AdminSection has already handled the case where they may reach neither.
 */
export const AdminLanding = () => {
  const permissions = useUserStore(useShallow((state) => state.user.permissions));
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();

  const firstPage = permittedAdminPages(permissions)[0];

  useEffect(() => {
    if (firstPage) {
      router.replace(`/${locale}/admin/${firstPage.slug}`);
    }
  }, [firstPage, locale, router]);

  return null;
};
