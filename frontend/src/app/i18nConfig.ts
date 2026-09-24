import { basePath } from '@utils/base-path';

const i18nConfig = {
  locales: ['sv', 'en'],
  defaultLocale: 'sv',
  // next-i18n-router builds its rewrite/redirect URLs itself, so it must know the basePath.
  basePath,
};

export default i18nConfig;
