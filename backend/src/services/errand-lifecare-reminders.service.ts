import { HttpException } from '@exceptions/HttpException';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareRemindersService from '@services/lifecare-reminders.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildReminderCreate, buildReminderUpdate, NewLifecareReminder, ReminderPerson } from '@utils/lifecare-reminder';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareReminderOptionsView, LifecareReminderView, toReminderOptions, toReminders } from '@/responses/lifecare-reminder.response';

const APPLICANT_ROLE = 'APPLICANT';

/**
 * The bevakningar on an errand's insats, read and written live in Lifecare — the register of record.
 * Nothing is kept in careM; careM only gets the access-log rows.
 */
class ErrandLifecareRemindersService {
  private remindersService = new LifecareRemindersService();
  private serviceIds = new LifecareServiceIdService();
  private stakeholderService = new CaremanagementStakeholderService();
  private accessLog = new LifecareAccessLogService();

  async list(errandId: string): Promise<LifecareReminderView[]> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const raw = await this.remindersService.listByService(serviceId);
    await this.accessLog.logRead(errandId, { target: 'REMINDERS', description: 'Läste bevakningar i Lifecare' });
    return toReminders(raw);
  }

  /** The priorities and statuses a bevakning can have, and what Lifecare proposes for a new one. */
  async options(errandId: string): Promise<LifecareReminderOptionsView> {
    const serviceId = await this.serviceIds.resolve(errandId);
    return toReminderOptions(await this.remindersService.readProposal(serviceId));
  }

  /** Creates a bevakning on the errand's insats in Lifecare, for the applicant. */
  async create(errandId: string, reminder: NewLifecareReminder): Promise<void> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const [proposal, person] = await Promise.all([this.remindersService.readProposal(serviceId), this.resolveApplicant(errandId)]);

    const create = buildReminderCreate(proposal, reminder, person);
    if (!create.writable) {
      throw new HttpException(400, create.reason);
    }
    await this.remindersService.create(create.body);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'REMINDER',
      description: 'Lade till en bevakning i Lifecare',
    });
  }

  /**
   * Changes a bevakning on the errand's insats — its date, text, priority or status, which is
   * also how it is marked done. Only a bevakning Lifecare lists for this insats can be changed through
   * this errand, so an id from somewhere else is refused rather than written.
   */
  async update(errandId: string, reminderId: number, reminder: NewLifecareReminder): Promise<void> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const [, proposal] = await Promise.all([this.assertOnInsats(serviceId, reminderId), this.remindersService.readProposal(serviceId)]);

    const current = await this.remindersService.readForEdit(reminderId);
    const update = buildReminderUpdate(current, proposal.options, reminder);
    if (!update.writable) {
      throw new HttpException(400, update.reason);
    }
    await this.remindersService.update(update.body);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.UPDATE, {
      target: 'REMINDER',
      description: 'Ändrade en bevakning i Lifecare',
      lifecareId: String(reminderId),
    });
  }

  /**
   * Removes a bevakning from the errand's insats in Lifecare. As with a change, only a bevakning Lifecare
   * lists for this insats can be removed through this errand.
   */
  async remove(errandId: string, reminderId: number): Promise<void> {
    const serviceId = await this.serviceIds.resolve(errandId);
    await this.assertOnInsats(serviceId, reminderId);
    await this.remindersService.remove(reminderId);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.DELETE, {
      target: 'REMINDER',
      description: 'Tog bort en bevakning i Lifecare',
      lifecareId: String(reminderId),
    });
  }

  /** Refuses an id Lifecare does not list for the insats, so no errand reaches another's bevakning. */
  private async assertOnInsats(serviceId: number, reminderId: number): Promise<void> {
    const list = await this.remindersService.listByService(serviceId);
    if (!list.reminders.some(candidate => candidate.reminderId === reminderId)) {
      throw new HttpException(404, 'Bevakningen finns inte på insatsen i Lifecare');
    }
  }

  /**
   * The applicant as Lifecare's bevakning names them. The personnummer is the one careM resolved the insats
   * from, so the bevakning is filed under the same person as the insats it hangs on.
   */
  private async resolveApplicant(errandId: string): Promise<ReminderPerson> {
    const stakeholders = await this.stakeholderService.readStakeholders(errandId);
    const applicant = (stakeholders.data ?? []).find(stakeholder => stakeholder.role === APPLICANT_ROLE);
    if (!applicant?.personalNumber) {
      throw new HttpException(404, 'Sökandes personnummer kunde inte slås upp');
    }
    return {
      personId: applicant.personalNumber,
      personName: [applicant.lastName, applicant.firstName].filter(Boolean).join(', '),
    };
  }
}

export default ErrandLifecareRemindersService;
