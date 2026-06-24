import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Notification } from '@/data-contracts/caremanagement/data-contracts';

/**
 * Owns the notification resource: a recipient's cross-errand notification list and the per-errand
 * acknowledge. caremanagement scopes the list to a single recipient (ownerId is required).
 */
class CaremanagementNotificationService {
  private apiService = new CaremanagementApiService();

  /** Lists the notifications addressed to a recipient (across all their errands), newest first. */
  async readNotifications(ownerId: string): Promise<ApiResponse<Notification[]>> {
    return this.apiService.get<Notification[]>({
      url: caremanagementUrl('notifications'),
      params: { ownerId, sort: 'created,desc' },
    });
  }

  /** Sets the acknowledged state of a single notification. */
  async acknowledge(
    errandId: string,
    notificationId: string,
    acknowledged: boolean
  ): Promise<ApiResponse<Notification>> {
    return this.apiService.patch<Notification>({
      url: caremanagementUrl('errands', errandId, 'notifications', notificationId),
      data: { acknowledged },
    });
  }
}

export default CaremanagementNotificationService;
