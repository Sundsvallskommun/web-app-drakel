import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Monitoring, MonitoringCount, MonitoringRequest } from '@/data-contracts/caremanagement/data-contracts';

/** Extracts the monitoring id (last path segment) from a caremanagement Location header. */
const monitoringIdFromLocation = (location?: string): string | undefined => location?.split('/').filter(Boolean).pop();

/**
 * Owns the bevakning (date-bound watch/reminder) sub-resource of a financial-assistance errand.
 * caremanagement calls this resource "monitorings"; we keep the Swedish "bevakning" name towards the
 * frontend.
 */
class CaremanagementBevakningService {
  private apiService = new CaremanagementApiService();

  async readBevakningar(errandId: string): Promise<ApiResponse<Monitoring[]>> {
    return this.apiService.get<Monitoring[]>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'monitorings'),
    });
  }

  /** The bevakning (monitoring) count for the errand (unlogged — safe to poll for a badge). */
  async readCount(errandId: string): Promise<ApiResponse<MonitoringCount>> {
    return this.apiService.get<MonitoringCount>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'monitorings', 'count'),
    });
  }

  async getBevakning(errandId: string, bevakningId: string): Promise<ApiResponse<Monitoring>> {
    return this.apiService.get<Monitoring>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'monitorings', bevakningId),
    });
  }

  /** Creates a bevakning. caremanagement returns 201 + Location (empty body), so resolve it by id. */
  async createBevakning(errandId: string, body: MonitoringRequest): Promise<ApiResponse<Monitoring>> {
    const created = await this.apiService.post<Monitoring>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'monitorings'),
      data: body,
    });
    const bevakningId = monitoringIdFromLocation(created.location);
    return bevakningId ? this.getBevakning(errandId, bevakningId) : created;
  }

  async updateBevakning(errandId: string, bevakningId: string, body: MonitoringRequest): Promise<ApiResponse<Monitoring>> {
    return this.apiService.put<Monitoring>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'monitorings', bevakningId),
      data: body,
    });
  }

  async deleteBevakning(errandId: string, bevakningId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'monitorings', bevakningId),
    });
  }
}

export default CaremanagementBevakningService;
