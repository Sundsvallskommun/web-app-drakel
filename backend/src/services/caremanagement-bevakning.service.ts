import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Bevakning, BevakningRequest } from '@/data-contracts/caremanagement/data-contracts';

/** Extracts the bevakning id (last path segment) from a caremanagement Location header. */
const bevakningIdFromLocation = (location?: string): string | undefined => location?.split('/').filter(Boolean).pop();

/** Owns the bevakning (date-bound watch/reminder) sub-resource of a financial-assistance errand. */
class CaremanagementBevakningService {
  private apiService = new CaremanagementApiService();

  async readBevakningar(errandId: string): Promise<ApiResponse<Bevakning[]>> {
    return this.apiService.get<Bevakning[]>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'bevakningar'),
    });
  }

  async getBevakning(errandId: string, bevakningId: string): Promise<ApiResponse<Bevakning>> {
    return this.apiService.get<Bevakning>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'bevakningar', bevakningId),
    });
  }

  /** Creates a bevakning. caremanagement returns 201 + Location (empty body), so resolve it by id. */
  async createBevakning(errandId: string, body: BevakningRequest): Promise<ApiResponse<Bevakning>> {
    const created = await this.apiService.post<Bevakning>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'bevakningar'),
      data: body,
    });
    const bevakningId = bevakningIdFromLocation(created.location);
    return bevakningId ? this.getBevakning(errandId, bevakningId) : created;
  }

  async updateBevakning(errandId: string, bevakningId: string, body: BevakningRequest): Promise<ApiResponse<Bevakning>> {
    return this.apiService.put<Bevakning>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'bevakningar', bevakningId),
      data: body,
    });
  }

  async deleteBevakning(errandId: string, bevakningId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'bevakningar', bevakningId),
    });
  }
}

export default CaremanagementBevakningService;
