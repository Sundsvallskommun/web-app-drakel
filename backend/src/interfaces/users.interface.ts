/** Permissions granted to a user, derived from their AD groups */
export interface Permissions {
  canEditErrands: boolean;
  /** Reach the /admin section: mallhantering and logguppföljning */
  canAdminister: boolean;
}

/** Internal roles, ordered from least to most privileged */
export type InternalRole = 'app_read' | 'app_admin' | 'app_superadmin';

export interface User {
  username: string;
  name: string;
  givenName: string;
  surname: string;
  groups: string[];
  role: InternalRole;
  permissions: Permissions;
}

export interface ClientUser {
  name: string;
  username: string;
  role: InternalRole;
  permissions: Permissions;
}
