import axios from 'axios';

import { ACTIVE_DIRECTORY_BASE_URL, ACTIVE_DIRECTORY_DOMAIN, MUNICIPALITY_ID } from '@/config';

/** A user object returned by the AD object-search (OUChildren). */
export interface AdUser {
  /** AD username — this is what an errand stores as `assignedUserId` (e.g. "edw25mol"). */
  name?: string;
  /** Human-readable name ("Efternamn Förnamn"). */
  displayName?: string;
  guid?: string;
  personId?: string;
  description?: string;
  domain?: string;
}

/**
 * Reads the handläggare roster from the Active Directory object-search. Reached directly (no gateway, no
 * auth), like caremanagement/templating; the host comes from ACTIVE_DIRECTORY_BASE_URL.
 */
class ActiveDirectoryService {
  /** All "user" objects in the configured domain (the object-name/class filters are accepted but ignored). */
  async searchUsers(): Promise<AdUser[]> {
    const base = ACTIVE_DIRECTORY_BASE_URL.replace(/\/+$/, '');
    const url = `${base}/${MUNICIPALITY_ID}/search/${ACTIVE_DIRECTORY_DOMAIN}`;
    const res = await axios.get<AdUser[]>(url, { params: { objectName: '*', objectClass: 'user' } });
    return Array.isArray(res.data) ? res.data : [];
  }
}

export default ActiveDirectoryService;
