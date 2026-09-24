import { LifecareJobStimulusRaw } from '@interfaces/lifecare-job-stimulus.interface';

import LifecareApiService from './lifecare-api.service';

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

// Lifecare's businessType for "businessId is an insats".
const SERVICE_BUSINESS_TYPE = '8';

/** Lifecare's jobbstimulans endpoints, with paths and query strings copied from captures of its web app. */
class LifecareJobStimulusService {
  private readonly apiService = new LifecareApiService();

  /** The sökandes and medsökandes jobbstimulans periods on an insats. */
  public async readForService(serviceId: number): Promise<LifecareJobStimulusRaw> {
    const res = await this.apiService.get<LifecareJobStimulusRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Calculation/GetJobStimulusForService',
      params: { businessType: SERVICE_BUSINESS_TYPE, businessId: String(serviceId) },
    });
    return res.data;
  }

  /**
   * The end Lifecare gives a period that starts on the date — its two-year rule, asked of the server so
   * Drakel follows the same rule as Lifecare. The answer is a bare JSON string, e.g. "2030-01-14".
   */
  public async readToDate(fromDate: string): Promise<string> {
    const res = await this.apiService.get<string>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Calculation/GetJobStimulusToDate',
      params: { id: fromDate },
    });
    return res.data;
  }

  /**
   * Saves a person's jobbstimulans periods. Replaces the whole set — a period left out of the body is
   * deleted, and every period comes back with a new id. Build the body with buildJobStimulusAdd.
   */
  public async save(body: Record<string, unknown>): Promise<LifecareJobStimulusRaw> {
    const res = await this.apiService.post<LifecareJobStimulusRaw>({ module: PROFESSIONAL_WEB, path: 'api2/Calculation/SaveJobStimulus' }, body);
    return res.data;
  }
}

export default LifecareJobStimulusService;
