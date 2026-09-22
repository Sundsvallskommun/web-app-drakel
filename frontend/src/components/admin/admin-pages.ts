import { PermissionsResponse } from '@data-contracts/backend/data-contracts';

/**
 * The pages of the admin section, in the order the navigation lists them.
 *
 * Each carries the permission that opens it. The two are granted by separate AD groups — maintaining the
 * shared mallar and following up who read which errand are different jobs — so a user can reach one page
 * and not the other, and the section has to be built for that rather than for a single "admin".
 */
export interface AdminPage {
  slug: string;
  labelKey: string;
  permission: keyof PermissionsResponse;
}

export const ADMIN_PAGES: AdminPage[] = [
  { slug: 'mallar', labelKey: 'nav.templates', permission: 'canManageTemplates' },
  { slug: 'loggar', labelKey: 'nav.logs', permission: 'canViewEventLog' },
];

/** The pages this user may open, in navigation order; empty when the whole section is closed to them. */
export const permittedAdminPages = (permissions: PermissionsResponse): AdminPage[] =>
  ADMIN_PAGES.filter((page) => permissions[page.permission]);
