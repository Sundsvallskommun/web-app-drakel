import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import {
  LifecareCalculationSaveRequest,
  LifecareCalculationView as CaremanagementLifecareCalculationView,
} from '@/data-contracts/caremanagement/data-contracts';
import { LifecareCalculationView, toLifecareCalculationView } from '@/responses/lifecare-calculation.response';

/** The errand's Beräkning route in careM, e.g. `calculationUrl(errandId, 'pdf')`. */
const calculationUrl = (errandId: string, ...parts: string[]): string => caremanagementLifecareUrl(errandId, 'calculation', ...parts);

/**
 * The errand's normberäkning in Lifecare, through careM. careM's draft is the working copy until the first Spara
 * creates the beräkning in Lifecare; careM links it to the errand and, from then on, saves Lifecare's own beräkning.
 * careM logs every read and write itself.
 */
class ErrandLifecareCalculationService {
  private apiService = new CaremanagementApiService();

  /** The errand's beräkning as it stands in Lifecare, or null while none has been saved (careM's 204). */
  async read(errandId: string): Promise<LifecareCalculationView | null> {
    const calculation = await this.apiService.getOrNull<CaremanagementLifecareCalculationView>({ url: calculationUrl(errandId) });
    return calculation === null ? null : toLifecareCalculationView(calculation);
  }

  /** The errand's beräkning as Lifecare prints it, a PDF in base64; careM answers 404 while none is saved there. */
  async pdf(errandId: string): Promise<string> {
    const pdf = await this.apiService.getBinary({ url: calculationUrl(errandId, 'pdf') });
    return pdf.toString('base64');
  }

  /**
   * Saves the beräkning in Lifecare: created from careM's draft the first time, Lifecare's own saved after that.
   * `finalize` saves it as slutlig, after which Lifecare allows no change.
   */
  async save(errandId: string, finalize = false): Promise<LifecareCalculationView> {
    const request: LifecareCalculationSaveRequest = { finalize };
    const response = await this.apiService.post<CaremanagementLifecareCalculationView>({ url: calculationUrl(errandId), data: request });
    return toLifecareCalculationView(response.data);
  }
}

export default ErrandLifecareCalculationService;
