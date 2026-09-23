import CaremanagementEventService from '@services/caremanagement-event.service';
import { logger } from '@utils/logger';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';

/** What in Lifecare was touched — stable names for the access log, not Lifecare paths. */
type LifecareAccessTarget =
  | 'JOURNAL_AND_DOCUMENTS'
  | 'JOURNAL_NOTE'
  | 'DOCUMENT'
  | 'PAYEES'
  | 'PAYEE'
  | 'PAYMENT'
  | 'REMINDERS'
  | 'REMINDER'
  | 'DECISION';

interface LoggedAccess {
  target: LifecareAccessTarget;
  description: string;
  lifecareId?: string;
}

/**
 * Logs what the BFF reads and writes in Lifecare on an errand's access log in careM.
 *
 * Verksamheten's rule is that every read is logged on the errand and the user. careM only sees what goes
 * through careM, so the BFF reports its own Lifecare calls afterwards — and nothing for a call Lifecare
 * refused, which is why callers report only once the Lifecare call has succeeded.
 */
class LifecareAccessLogService {
  private eventService = new CaremanagementEventService();

  /**
   * Logs a read. The report has to land before the data is handed over: a read careM could not log is
   * not shown, so a failed report fails the request.
   */
  async logRead(errandId: string, access: LoggedAccess): Promise<void> {
    await this.eventService.reportLifecareAccess(errandId, [{ action: LifecareAccessActionEnum.READ, ...access }]);
  }

  /**
   * Logs a write. By now Lifecare has already made the change and it cannot be taken back, so a failed
   * report is logged here rather than raised — raising would invite the handläggare to write it again.
   */
  async logWrite(errandId: string, action: LifecareAccessActionEnum.CREATE | LifecareAccessActionEnum.UPDATE, access: LoggedAccess): Promise<void> {
    try {
      await this.eventService.reportLifecareAccess(errandId, [{ action, ...access }]);
    } catch {
      logger.error(`Wrote ${access.target} ${access.lifecareId ?? ''} in Lifecare for errand ${errandId} but could not log it in careM`);
    }
  }
}

export default LifecareAccessLogService;
