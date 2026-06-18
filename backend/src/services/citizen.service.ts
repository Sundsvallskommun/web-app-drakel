import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';

import ApiService from './api.service';

/**
 * Reads from the Citizen gateway API. Used to resolve a stakeholder's partyId (their caremanagement
 * `externalId`) to a personnummer for display in the handläggar-UI.
 */
class CitizenService {
  private apiService = new ApiService();

  /**
   * Resolves a partyId to its personnummer via `GET citizen/{version}/{municipalityId}/{partyId}/personnumber`.
   * Best-effort: returns null on 204/404/any error so listing stakeholders never fails just because the
   * Citizen API is unavailable or the person is unknown.
   */
  async getPersonnumber(partyId: string): Promise<string | null> {
    const url = `${getApiBase('citizen')}/${MUNICIPALITY_ID}/${partyId}/personnumber`;
    try {
      const res = await this.apiService.get<string>({ url });
      const personnumber = res.data?.toString().trim() || '';
      return personnumber.length > 0 ? personnumber : null;
    } catch {
      console.error('Failed to resolve personnummer for partyId', partyId);
      return null;
    }
  }
}

export default CitizenService;
