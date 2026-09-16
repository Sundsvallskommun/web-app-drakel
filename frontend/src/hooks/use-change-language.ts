'use client';

import i18nConfig from '@app/i18nConfig';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// next-i18n-router reads the chosen language from this cookie when redirecting unprefixed paths.
const LOCALE_COOKIE = 'NEXT_LOCALE';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Switches the UI language: remembers the choice in the NEXT_LOCALE cookie and navigates to the same page under
 * the new language's path prefix (the default language has no prefix).
 */
export const useChangeLanguage = (): { currentLanguage: string; changeLanguage: (language: string) => void } => {
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const currentLanguage = i18n.language;

  const changeLanguage = useCallback(
    (language: string) => {
      if (language === currentLanguage) {
        return;
      }
      document.cookie = `${LOCALE_COOKIE}=${language};path=/;max-age=${ONE_YEAR_IN_SECONDS};SameSite=Lax`;

      // usePathname excludes the basePath, and router.push adds it back.
      const pathWithoutLanguage =
        currentLanguage === i18nConfig.defaultLocale ?
          pathname
        : pathname.replace(new RegExp(`^/${currentLanguage}(?=/|$)`), '') || '/';
      const nextPath =
        language === i18nConfig.defaultLocale ? pathWithoutLanguage : `/${language}${pathWithoutLanguage}`;

      router.push(nextPath);
      router.refresh();
    },
    [currentLanguage, pathname, router]
  );

  return { currentLanguage, changeLanguage };
};
