/// <reference types="vite/client" />
// Adds the @testing-library/jest-dom matchers (toBeInTheDocument, …) to Vitest's `expect`.
import '@testing-library/jest-dom/vitest';

import i18next, { ResourceLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { I18N_NAMESPACES } from './src/app/i18n-namespaces';

// Components translate their texts with react-i18next; tests render them in Swedish, like the app's default.
const swedishFiles = import.meta.glob<ResourceLanguage[string]>('./locales/sv/*.json', {
  eager: true,
  import: 'default',
});
const swedish: ResourceLanguage = Object.fromEntries(
  Object.entries(swedishFiles).map(([path, translations]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), translations])
);

void i18next.use(initReactI18next).init({
  lng: 'sv',
  fallbackLng: 'sv',
  ns: I18N_NAMESPACES,
  defaultNS: 'common',
  resources: { sv: swedish },
  interpolation: { escapeValue: false },
});
