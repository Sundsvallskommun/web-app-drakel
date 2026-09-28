import ApiService from '@services/api.service';
import { gatewayUrl } from '@utils/gateway-url';

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
  private apiService = new ApiService();

  /** All "user" objects in the configured domain (the object-name/class filters are accepted but ignored). */
  async searchUsers(): Promise<AdUser[]> {
    const response = await this.apiService.get<AdUser[]>({
      url: gatewayUrl('activedirectory', MUNICIPALITY_ID, 'search', ACTIVE_DIRECTORY_DOMAIN),
      params: { objectName: '*', objectClass: 'user' },
    });
    return Array.isArray(response.data) ? response.data : [];
  }
}

export default ActiveDirectoryService;
