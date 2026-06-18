import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Stakeholder } from '@/data-contracts/caremanagement/data-contracts';
import { CreateStakeholderDto } from '@/dtos/stakeholder.dto';

import CitizenService from './citizen.service';

// externalIdType values that mean an organization (no personnummer to resolve). Everything else is
// treated as a private person.
const ORGANIZATION_ID_TYPES = new Set(['ORGANIZATION', 'ENTERPRISE']);

/** A stakeholder enriched with the personnummer resolved from its partyId via the Citizen API. */
type EnrichedStakeholder = Stakeholder & { personalNumber?: string };

class CaremanagementStakeholderService {
  private apiService = new CaremanagementApiService();
  private citizenService = new CitizenService();

  async readStakeholders(errandId: string): Promise<ApiResponse<EnrichedStakeholder[]>> {
    const res = await this.apiService.get<Stakeholder[]>({
      url: caremanagementUrl('errands', errandId, 'stakeholders'),
    });
    const enriched = await Promise.all((res.data ?? []).map((stakeholder) => this.enrich(stakeholder)));
    return { ...res, data: enriched };
  }

  async createStakeholder(errandId: string, stakeholder: CreateStakeholderDto): Promise<ApiResponse<null>> {
    return this.apiService.post<null>({
      url: caremanagementUrl('errands', errandId, 'stakeholders'),
      data: stakeholder,
    });
  }

  /** Adds the personnummer (resolved from partyId) to a private stakeholder. Best-effort; orgs are skipped. */
  private async enrich(stakeholder: Stakeholder): Promise<EnrichedStakeholder> {
    if (!stakeholder.externalId || this.isOrganization(stakeholder)) {
      return stakeholder;
    }
    const personalNumber = await this.citizenService.getPersonnumber(stakeholder.externalId);
    return personalNumber ? { ...stakeholder, personalNumber } : stakeholder;
  }

  private isOrganization(stakeholder: Stakeholder): boolean {
    return !!stakeholder.organizationName || ORGANIZATION_ID_TYPES.has(stakeholder.externalIdType ?? '');
  }
}

export default CaremanagementStakeholderService;
