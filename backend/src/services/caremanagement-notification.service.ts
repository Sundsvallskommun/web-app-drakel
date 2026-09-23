import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Notification } from '@/data-contracts/caremanagement/data-contracts';

/** The states a notification can be moved to; an omitted one is left as it was. */
interface NotificationState {
  acknowledged?: boolean;
  handled?: boolean;
}

/**
 * Owns the notification resource: a recipient's cross-errand notification list and the per-errand state
 * changes. caremanagement scopes the list to a single recipient (ownerId is required).
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

  /**
   * Moves a single notification between the read and handled states. Setting handled also acknowledges
   * it upstream, so the caller does not have to send both.
   */
  async updateNotification(errandId: string, notificationId: string, state: NotificationState): Promise<ApiResponse<Notification>> {
    return this.apiService.patch<Notification>({
      url: caremanagementUrl('errands', errandId, 'notifications', notificationId),
      data: state,
    });
  }

  /** Marks every notification on an errand as handled. */
  async markAllHandled(errandId: string): Promise<ApiResponse<null>> {
    return this.apiService.put<null>({
      url: caremanagementUrl('errands', errandId, 'notifications', 'handled'),
      data: {},
    });
  }
}

export default CaremanagementNotificationService;
