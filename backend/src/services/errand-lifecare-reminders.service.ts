import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import { LifecareReminder, LifecareReminderOptions, LifecareReminderRequest } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareReminderOptionsView, LifecareReminderView, toReminderOptionsView, toReminderView } from '@/responses/lifecare-reminder.response';

/**
 * The bevakningar on an errand's insats in Lifecare, through careM. careM reads and writes them in Lifecare,
 * refuses a bevakning Lifecare does not list on the errand's insats (404), and logs every access itself.
 */
class ErrandLifecareRemindersService {
  private apiService = new CaremanagementApiService();

  /** The bevakningar on the insats, soonest first. */
  async list(errandId: string): Promise<LifecareReminderView[]> {
    const response = await this.apiService.get<LifecareReminder[]>({ url: caremanagementLifecareUrl(errandId, 'reminders') });
    return response.data.map(toReminderView);
  }

  /** The priorities and statuses a bevakning can have, and what Lifecare proposes for a new one. */
  async options(errandId: string): Promise<LifecareReminderOptionsView> {
    const response = await this.apiService.get<LifecareReminderOptions>({ url: caremanagementLifecareUrl(errandId, 'reminders', 'options') });
    return toReminderOptionsView(response.data);
  }

  /** Creates a bevakning on the errand's insats, for the applicant. careM answers 201 without a body. */
  async create(errandId: string, reminder: LifecareReminderRequest): Promise<void> {
    await this.apiService.post({ url: caremanagementLifecareUrl(errandId, 'reminders'), data: reminder });
  }

  /** Changes a bevakning's date, text, priority or status — also how it is marked done. careM answers 204. */
  async update(errandId: string, reminderId: number, reminder: LifecareReminderRequest): Promise<void> {
    await this.apiService.put({ url: caremanagementLifecareUrl(errandId, 'reminders', String(reminderId)), data: reminder });
  }

  /** Removes a bevakning from the errand's insats. careM answers 204. */
  async remove(errandId: string, reminderId: number): Promise<void> {
    await this.apiService.delete({ url: caremanagementLifecareUrl(errandId, 'reminders', String(reminderId)) });
  }
}

export default ErrandLifecareRemindersService;
