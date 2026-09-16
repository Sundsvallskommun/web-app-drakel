import { I18N_NAMESPACES } from '@app/i18n-namespaces';
import i18nConfig from '@app/i18nConfig';
import LocalizationProvider from '@components/localization-provider/localization-provider';
import { headers } from 'next/headers';
import { ReactNode } from 'react';

import initLocalization from '../i18n';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const namespaces = I18N_NAMESPACES;

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  const { locale } = await params;
  const { resources } = await initLocalization(locale, namespaces);

  return <LocalizationProvider {...{ locale, resources, namespaces }}>{children}</LocalizationProvider>;
};

export const generateMetadata = async ({ params }: LocaleLayoutProps) => {
  const { locale } = await params;
  const { t } = await initLocalization(locale, namespaces);
  const requestPath = (await headers()).get('x-path');
  // Titles are keyed by the page's first path segment without the language prefix (e.g. "/arende" for
  // "/en/arende/FINANCIAL_ASSISTANCE-1").
  const segments = (requestPath ?? '').split('/').filter(Boolean);
  if (segments[0] && i18nConfig.locales.includes(segments[0])) {
    segments.shift();
  }
  const path = segments[0] ? `/${segments[0]}` : null;

  const pathName =
    !path ? null : (
      path
        .replace(/^\/?/, '') // Remove leading slash
        .split('/') // Split into sections
        .map(
          (s) =>
            `${s.substring(0, 1).toUpperCase()}${s.substring(1)}` // Capitalize the first letter
              .replace('-', ' ') // Replace separators
        )
        .join(', ')
    ); // Comma separate sections

  const title =
    path ?
      `${process.env.NEXT_PUBLIC_APP_NAME} - ${t(`paths:${path}.title`, { defaultValue: pathName })}`
    : process.env.NEXT_PUBLIC_APP_NAME;
  const description = t(`paths:${path}.description`, { defaultValue: '' });

  return {
    title,
    description,
  };
};

export default LocaleLayout;
