import {
  LifecareEditableReminderRaw,
  LifecareReminderEditCompositeRaw,
  LifecareReminderListRaw,
  LifecareReminderProposalRaw,
} from '@interfaces/lifecare-reminder.interface';

import LifecareApiService from './lifecare-api.service';

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

/**
 * Lifecare's bevakning endpoints, with paths copied from captures of its own web app (2026-09-23) —
 * down to the trailing slash on `CreateReminder/` and none on the others.
 */
class LifecareRemindersService {
  private readonly apiService = new LifecareApiService();

  /** The bevakningar on the insats, and on the beslut and aktualiseringar under it. */
  public async listByService(serviceId: number): Promise<LifecareReminderListRaw> {
    const res = await this.apiService.get<LifecareReminderListRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Reminders/ListRemindersByServiceId',
      params: { id: String(serviceId) },
    });
    return res.data;
  }

  /** The underlag for a new bevakning on the insats: what it can hang on, the choices and a blank bevakning. */
  public async readProposal(serviceId: number): Promise<LifecareReminderProposalRaw> {
    const res = await this.apiService.get<LifecareReminderProposalRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Reminders/GetProposalForService',
      params: { id: String(serviceId) },
    });
    return res.data;
  }

  /** One bevakning in the shape Lifecare's editor works on — the object `UpdateReminder` takes back. */
  public async readForEdit(reminderId: number): Promise<LifecareEditableReminderRaw> {
    const res = await this.apiService.get<LifecareReminderEditCompositeRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Reminders/GetReminderEditComposite',
      params: { reminderId: String(reminderId), readOptions: 'false' },
    });
    return res.data.reminder;
  }

  /** Saves a changed bevakning — also how one is marked done (status "Klar"). */
  public async update(reminder: Record<string, unknown>): Promise<void> {
    await this.apiService.post<unknown>({ module: PROFESSIONAL_WEB, path: 'api2/Reminders/UpdateReminder/' }, reminder);
  }

  /** Creates a bevakning. Not idempotent — a second call creates a second one. */
  public async create(reminder: Record<string, unknown>): Promise<void> {
    await this.apiService.post<unknown>({ module: PROFESSIONAL_WEB, path: 'api2/Reminders/CreateReminder/' }, reminder);
  }
}

export default LifecareRemindersService;
