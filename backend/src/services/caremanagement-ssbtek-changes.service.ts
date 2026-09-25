import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { AppliedSsbtekChanges, SsbtekChanges } from '@/data-contracts/caremanagement/data-contracts';

const changesUrl = (errandId: string, ...parts: string[]): string =>
  caremanagementUrl('errands', 'financial-assistance', errandId, 'calculation', 'ssbtek-changes', ...parts);

/**
 * careM's comparison of SSBTEK with the errand's normberäkning saved in Lifecare, and its record of what has been
 * written there from SSBTEK — the spärr that keeps an income from being transferred twice.
 */
class CaremanagementSsbtekChangesService {
  private apiService = new CaremanagementApiService();

  /**
   * Where the normberäkning in Lifecare no longer matches SSBTEK, per income type and person. careM answers 404 when
   * no normberäkning is linked to the errand (not saved in Lifecare yet), after finalize, or when it is not found.
   */
  async readChanges(errandId: string): Promise<SsbtekChanges> {
    return (await this.apiService.get<SsbtekChanges>({ url: changesUrl(errandId) })).data;
  }

  /** Tells careM which incomes were written into the normberäkning from SSBTEK, so it records them as the system's. */
  async reportApplied(errandId: string, applied: AppliedSsbtekChanges): Promise<void> {
    await this.apiService.post<null>({ url: changesUrl(errandId, 'applied'), data: applied });
  }
}

export default CaremanagementSsbtekChangesService;
