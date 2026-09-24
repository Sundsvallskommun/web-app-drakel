import { basePath } from '@utils/base-path';

/** Absolute URL to an app path (without basePath, as returned by usePathname), e.g. "/sv/oversikt". */
export const appURL = (path = ''): string => {
  return `${window.location.origin}${basePath}${path}`;
};
