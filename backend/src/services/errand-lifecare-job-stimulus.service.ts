import { HttpException } from '@exceptions/HttpException';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildJobStimulusAdd } from '@utils/lifecare-job-stimulus';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { AddJobStimulusPeriodDto } from '@/dtos/job-stimulus.dto';
import { JobStimulusPeriod, toJobStimulusPeriods } from '@/responses/job-stimulus.response';

/**
 * The jobbstimulans periods of an errand's sökande and medsökande, read straight from the insats in
 * Lifecare — the register of record. Every read lands in the errand's access log in careM.
 */
class ErrandLifecareJobStimulusService {
  private jobStimulus = new LifecareJobStimulusService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();

  async periods(errandId: string): Promise<JobStimulusPeriod[]> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const raw = await this.jobStimulus.readForService(serviceId);
    await this.accessLog.logRead(errandId, { target: 'JOB_STIMULUS', description: 'Läste jobbstimulans i Lifecare' });
    return toJobStimulusPeriods(raw);
  }

  /**
   * Adds a jobbstimulans period for the sökande. Lifecare's save replaces every period the person has, so
   * the current set is read first and sent back whole with the new one; its end is Lifecare's two-year rule
   * unless the handläggare set one.
   */
  async addPeriod(errandId: string, input: AddJobStimulusPeriodDto): Promise<JobStimulusPeriod[]> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const [current, toDate] = await Promise.all([
      this.jobStimulus.readForService(serviceId),
      input.toDate ? Promise.resolve(input.toDate) : this.jobStimulus.readToDate(input.fromDate),
    ]);
    await this.accessLog.logRead(errandId, { target: 'JOB_STIMULUS', description: 'Läste jobbstimulans i Lifecare' });

    const save = buildJobStimulusAdd(current, { fromDate: input.fromDate, toDate });
    if (!save.writable) {
      throw new HttpException(422, save.reason);
    }
    const saved = await this.jobStimulus.save(save.body);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'JOB_STIMULUS',
      description: `Lade till en jobbstimulansperiod i Lifecare (${input.fromDate} – ${toDate})`,
    });
    return toJobStimulusPeriods(saved);
  }
}

export default ErrandLifecareJobStimulusService;
