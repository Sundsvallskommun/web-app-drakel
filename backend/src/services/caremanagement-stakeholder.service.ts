import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Stakeholder } from '@/data-contracts/caremanagement/data-contracts';
import { CreateStakeholderDto } from '@/dtos/stakeholder.dto';

import CitizenService, { PersonName } from './citizen.service';

// externalIdType values that mean an organization (no personnummer to resolve). Everything else is
// treated as a private person.
const ORGANIZATION_ID_TYPES = new Set(['ORGANIZATION', 'ENTERPRISE']);

const APPLICANT_ROLE = 'APPLICANT';
const CO_APPLICANT_ROLE = 'CO_APPLICANT';

/** A party's name as stored on its stakeholder, or else its partyId so the name can be resolved from Citizen. */
export interface PartyReference {
  name?: string;
  partyId?: string;
}

const toPartyReference = (stakeholder: Stakeholder): PartyReference => {
  const storedName = stakeholder.organizationName ?? [stakeholder.firstName, stakeholder.lastName].filter(Boolean).join(' ');
  return storedName ? { name: storedName } : { partyId: stakeholder.externalId };
};

/** A stakeholder enriched with the personnummer resolved from its partyId via the Citizen API. */
type EnrichedStakeholder = Stakeholder & { personalNumber?: string };

const hasName = (stakeholder: Stakeholder): boolean => !!stakeholder.firstName || !!stakeholder.lastName || !!stakeholder.organizationName;

class CaremanagementStakeholderService {
  private apiService = new CaremanagementApiService();
  private citizenService = new CitizenService();

  async readStakeholders(errandId: string): Promise<ApiResponse<EnrichedStakeholder[]>> {
    const res = await this.fetchStakeholders(errandId);
    const stakeholders = res.data ?? [];
    // Names are often missing on the stakeholders (the application only stores the partyId), so resolve the
    // missing ones from Citizen in a single batch call.
    const names = await this.citizenService.getNamesByPartyId(
      stakeholders.filter(stakeholder => this.isPrivatePerson(stakeholder) && !hasName(stakeholder)).map(stakeholder => stakeholder.externalId ?? ''),
    );
    const enriched = await Promise.all(stakeholders.map(stakeholder => this.enrich(stakeholder, names)));
    return { ...res, data: enriched };
  }

  /**
   * The errand's applicant and co-applicants as party references (stored name, or partyId for the caller to
   * resolve in bulk from Citizen).
   */
  async readApplicants(errandId: string): Promise<{ applicant?: PartyReference; coApplicants: PartyReference[] }> {
    const res = await this.fetchStakeholders(errandId);
    const stakeholders = res.data ?? [];
    const applicant = stakeholders.find(stakeholder => stakeholder.role === APPLICANT_ROLE);
    return {
      applicant: applicant ? toPartyReference(applicant) : undefined,
      coApplicants: stakeholders.filter(stakeholder => stakeholder.role === CO_APPLICANT_ROLE).map(stakeholder => toPartyReference(stakeholder)),
    };
  }

  async createStakeholder(errandId: string, stakeholder: CreateStakeholderDto): Promise<ApiResponse<null>> {
    return this.apiService.post<null>({
      url: caremanagementUrl('errands', errandId, 'stakeholders'),
      data: stakeholder,
    });
  }

  private async fetchStakeholders(errandId: string): Promise<ApiResponse<Stakeholder[]>> {
    return this.apiService.get<Stakeholder[]>({
      url: caremanagementUrl('errands', errandId, 'stakeholders'),
    });
  }

  /**
   * Adds the personnummer (resolved from partyId) and, when missing, the name to a private stakeholder.
   * Best-effort; orgs are skipped.
   */
  private async enrich(stakeholder: Stakeholder, names: Map<string, PersonName>): Promise<EnrichedStakeholder> {
    if (!stakeholder.externalId || !this.isPrivatePerson(stakeholder)) {
      return stakeholder;
    }
    const personalNumber = await this.citizenService.getPersonnumber(stakeholder.externalId);
    const name = hasName(stakeholder) ? undefined : names.get(stakeholder.externalId.toLowerCase());
    return {
      ...stakeholder,
      ...(personalNumber ? { personalNumber } : {}),
      ...(name ? { firstName: name.firstName, lastName: name.lastName } : {}),
    };
  }

  private isPrivatePerson(stakeholder: Stakeholder): boolean {
    return !stakeholder.organizationName && !ORGANIZATION_ID_TYPES.has(stakeholder.externalIdType ?? '');
  }
}

export default CaremanagementStakeholderService;
