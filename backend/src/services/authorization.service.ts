import { ADMIN_GROUP, AUTHORIZED_GROUPS, LOG_ADMIN_GROUP, TEMPLATE_ADMIN_GROUP } from '@config';
import { InternalRole, Permissions } from '@interfaces/users.interface';
import { logger } from '@utils/logger';

const splitGroups = (groups?: string): string[] =>
  (groups ?? '')
    .split(',')
    .map(group => group.trim().toLowerCase())
    .filter(Boolean);

/**
 * Checks whether a user belongs to at least one of the configured authorized groups.
 * @param groups Comma-separated list of the user's AD groups
 */
export function authorizeGroups(groups: string): boolean {
  const authorizedGroups = splitGroups(AUTHORIZED_GROUPS);
  const userGroups = splitGroups(groups);
  logger.info(`Authorizing user groups [${userGroups.join(', ')}] against [${authorizedGroups.join(', ')}]`);
  return authorizedGroups.some(authorizedGroup => userGroups.includes(authorizedGroup));
}

const defaultPermissions = (): Permissions => ({
  canEditErrands: false,
  canManageTemplates: false,
  canViewEventLog: false,
});

/**
 * What each configured AD group grants. The three are independent and are configured separately:
 * maintaining the municipality's shared mallar, following up who read which errand, and handläggning
 * itself are three different jobs, and being trusted with one says nothing about the others.
 *
 * A user in several groups gets the union of what they grant.
 */
const grantsByGroup: { groups: string[]; grants: Partial<Permissions> }[] = [
  { groups: splitGroups(ADMIN_GROUP), grants: { canEditErrands: true } },
  { groups: splitGroups(TEMPLATE_ADMIN_GROUP), grants: { canManageTemplates: true } },
  { groups: splitGroups(LOG_ADMIN_GROUP), grants: { canViewEventLog: true } },
];

const isAdminGroup = (group: string): boolean => splitGroups(ADMIN_GROUP).includes(group.toLowerCase());

/** Whether a group opens either half of /admin. */
const isAdminSectionGroup = (group: string): boolean =>
  [...splitGroups(TEMPLATE_ADMIN_GROUP), ...splitGroups(LOG_ADMIN_GROUP)].includes(group.toLowerCase());

/**
 * Collects the permissions granted by all of the user's groups.
 * @param groups The user's AD groups
 */
export const getPermissions = (groups: string[]): Permissions => {
  const permissions = defaultPermissions();
  const userGroups = groups.map(group => group.toLowerCase());
  grantsByGroup.forEach(({ groups: configured, grants }) => {
    if (!configured.some(group => userGroups.includes(group))) {
      return;
    }
    (Object.keys(grants) as (keyof Permissions)[]).forEach(permission => {
      if (grants[permission]) {
        permissions[permission] = true;
      }
    });
  });
  return permissions;
};

/**
 * Returns the most privileged role for the user's groups. The role is a summary for display — what a
 * user may actually do is the permissions, which the two halves of /admin grant independently.
 * @param groups The user's AD groups
 */
export const getRole = (groups: string[]): InternalRole =>
  groups.some(isAdminSectionGroup) ? 'app_superadmin' : groups.some(isAdminGroup) ? 'app_admin' : 'app_read';
