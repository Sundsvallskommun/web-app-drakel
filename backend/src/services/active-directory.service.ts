import { gatewayAuthorization } from '@services/api-token.service';
import { gatewayUrl } from '@utils/gateway-url';
import axios from 'axios';

import { ACTIVE_DIRECTORY_DOMAIN, MUNICIPALITY_ID } from '@/config';

/** A user object returned by the AD object-search (OUChildren). */
interface AdUser {
  /** AD username — this is what an errand stores as `assignedUserId` (e.g. "edw25mol"). */
  name?: string;
  /** Human-readable name ("Efternamn Förnamn"). */
  displayName?: string;
  guid?: string;
  personId?: string;
  description?: string;
  domain?: string;
}

/** Reads the handläggare roster from the Active Directory object-search, through the WSO2 gateway. */
class ActiveDirectoryService {
  /** All "user" objects in the configured domain (the object-name/class filters are accepted but ignored). */
  async searchUsers(): Promise<AdUser[]> {
    const url = gatewayUrl('activedirectory', MUNICIPALITY_ID, 'search', ACTIVE_DIRECTORY_DOMAIN);
    const res = await axios.get<AdUser[]>(url, {
      params: { objectName: '*', objectClass: 'user' },
      headers: await gatewayAuthorization(),
    });
    return Array.isArray(res.data) ? res.data : [];
  }
}

export default ActiveDirectoryService;
