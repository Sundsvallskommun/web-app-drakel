import { ADMIN_GROUP, AUTHORIZED_GROUPS, SUPERADMIN_GROUP } from '@config';
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
  canAdminister: false,
});

const permissionsByRole = new Map<InternalRole, Partial<Permissions>>([
  ['app_read', {}],
  ['app_admin', { canEditErrands: true }],
  ['app_superadmin', { canEditErrands: true, canAdminister: true }],
]);

/**
 * Maps configured AD groups to internal roles. The admin group grants the admin role, the superadmin
 * group the superadmin role. The two are configured independently, so a superadmin group does not have
 * to be listed in ADMIN_GROUP as well — the superadmin role carries the admin permissions with it.
 */
const adminGroups = splitGroups(ADMIN_GROUP);
const superadminGroups = splitGroups(SUPERADMIN_GROUP);

const isAdminGroup = (group: string): boolean => adminGroups.includes(group.toLowerCase());

const isSuperadminGroup = (group: string): boolean => superadminGroups.includes(group.toLowerCase());

const roleForGroup = (group: string): InternalRole => (isSuperadminGroup(group) ? 'app_superadmin' : isAdminGroup(group) ? 'app_admin' : 'app_read');

/**
 * Collects the permissions granted by all of the user's groups.
 * @param groups The user's AD groups
 */
export const getPermissions = (groups: string[]): Permissions => {
  const permissions = defaultPermissions();
  groups.forEach(group => {
    const rolePermissions = permissionsByRole.get(roleForGroup(group));
    if (!rolePermissions) {
      return;
    }
    (Object.keys(rolePermissions) as (keyof Permissions)[]).forEach(permission => {
      if (rolePermissions[permission]) {
        permissions[permission] = true;
      }
    });
  });
  return permissions;
};

/**
 * Returns the most privileged role for the user's groups.
 * @param groups The user's AD groups
 */
export const getRole = (groups: string[]): InternalRole =>
  groups.some(isSuperadminGroup) ? 'app_superadmin' : groups.some(isAdminGroup) ? 'app_admin' : 'app_read';
