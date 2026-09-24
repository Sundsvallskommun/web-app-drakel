/** The sub-path the app is served under (e.g. "/drakel"), or "" when served at the root. Baked in at build time. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Strips the basePath from a browser pathname, e.g. "/drakel/sv/oversikt" → "/sv/oversikt". */
export const withoutBasePath = (pathname: string): string => {
  if (!basePath || (pathname !== basePath && !pathname.startsWith(`${basePath}/`))) {
    return pathname;
  }
  return pathname.slice(basePath.length) || '/';
};
