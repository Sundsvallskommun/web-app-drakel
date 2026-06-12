/** Permissions granted to a user, derived from their AD groups */
export interface Permissions {
  canEditErrands: boolean;
}

/** Internal roles, ordered from least to most privileged */
export type InternalRole = 'app_read' | 'app_admin';

export enum InternalRoleEnum {
  'app_read',
  'app_admin',
}

export type User = {
  username: string;
  name: string;
  givenName: string;
  surname: string;
  groups: string[];
  role: InternalRole;
  permissions: Permissions;
};

export type ClientUser = {
  name: string;
  username: string;
  role: InternalRole;
  permissions: Permissions;
};
