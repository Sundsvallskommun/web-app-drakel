import { MUNICIPALITY_ID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { CitizenExtended } from '@/data-contracts/citizen/data-contracts';

import ApiService from './api.service';

// Citizen flags classified identities and protected personnummer with "J" (ja).
const CITIZEN_FLAG_YES = 'J';

export interface PersonName {
  firstName: string;
  lastName: string;
}

/** A citizen's name, or null when it's missing or the person has a protected identity. */
const citizenName = (citizen: CitizenExtended): PersonName | null => {
  if (citizen.classified === CITIZEN_FLAG_YES || citizen.protectedNR === CITIZEN_FLAG_YES) {
    return null;
  }
  const firstName = citizen.givenname?.trim() ?? '';
  const lastName = citizen.lastname?.trim() ?? '';
  return firstName || lastName ? { firstName, lastName } : null;
};

/** "Förnamn Efternamn". */
export const personDisplayName = (name: PersonName): string => [name.firstName, name.lastName].filter(Boolean).join(' ');

/**
 * Reads from the Citizen gateway API. Used to resolve a stakeholder's partyId (their caremanagement
 * `externalId`) to a personnummer and a name for display in the handläggar-UI.
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
      // Citizen returns the personnummer as a JSON number, so coerce to string before trimming. (A
      // 12-digit personnummer always starts with the century, so there's no leading zero to lose.)
      const res = await this.apiService.get<string | number>({ url });
      const personnumber = res.data?.toString().trim() || '';
      return personnumber.length > 0 ? personnumber : null;
    } catch {
      console.error('Failed to resolve personnummer for partyId', partyId);
      return null;
    }
  }

  /**
   * Resolves partyIds to names in one call via `POST citizen/{version}/{municipalityId}/batch`. Keys are
   * lower-cased partyIds (caremanagement stores them in either case). People with a protected identity get no
   * name. Best-effort: returns an empty map on any error so callers can fall back to showing no name.
   */
  async getNamesByPartyId(partyIds: string[]): Promise<Map<string, PersonName>> {
    const uniquePartyIds = [...new Set(partyIds.map(partyId => partyId.toLowerCase()))];
    const names = new Map<string, PersonName>();
    if (uniquePartyIds.length === 0) {
      return names;
    }
    const url = `${getApiBase('citizen')}/${MUNICIPALITY_ID}/batch`;
    try {
      const res = await this.apiService.post<CitizenExtended[]>({ url, data: uniquePartyIds });
      for (const citizen of res.data ?? []) {
        const name = citizenName(citizen);
        if (citizen.personId && name) {
          names.set(citizen.personId.toLowerCase(), name);
        }
      }
    } catch {
      console.error('Failed to resolve names for', uniquePartyIds.length, 'partyIds');
    }
    return names;
  }
}

export default CitizenService;
