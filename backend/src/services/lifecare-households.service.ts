import { LifecareCalculationCandidateRaw, LifecareHouseholdsRaw } from '@interfaces/lifecare-household.interface';

import LifecareApiService from './lifecare-api.service';

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

/** Lifecare's hushåll endpoints, with paths and query strings copied from a capture of its web app (2026-09-24). */
class LifecareHouseholdsService {
  private readonly apiService = new LifecareApiService();

  /** Every hushåll the person has had, with its members and bonusbarn. */
  public async listForPerson(personId: string): Promise<LifecareHouseholdsRaw> {
    const res = await this.apiService.get<LifecareHouseholdsRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Household/ListHouseholdsForPerson',
      params: { id: personId },
    });
    return res.data;
  }

  /** Persons Lifecare knows that match the search text — by name or personnummer — for a beräkning to take in. */
  public async findCandidates(filter: string): Promise<LifecareCalculationCandidateRaw[]> {
    const res = await this.apiService.get<LifecareCalculationCandidateRaw[]>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Calculation/FindCalculationCandidates',
      params: { filter },
    });
    return res.data;
  }

  /** Adds the person as a bonusbarn to the hushåll of the insats's person. Lifecare answers with no content. */
  public async addBonusChild(serviceId: number, personId: string): Promise<void> {
    await this.apiService.post<unknown>(
      { module: PROFESSIONAL_WEB, path: 'api2/Household/AddBonusChildToHousehold/' },
      { bonusChildPersonId: personId, serviceId, investigationId: 0 },
    );
  }
}

export default LifecareHouseholdsService;
