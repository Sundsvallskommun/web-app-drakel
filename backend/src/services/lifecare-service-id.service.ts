import { HttpException } from '@exceptions/HttpException';
import CaremanagementErrandService from '@services/caremanagement-errand.service';

/**
 * Resolves the insats in Lifecare an errand is. Every drakel errand is one insats, and almost every
 * Lifecare endpoint drakel writes through is keyed on it (`serviceId` / `businessId`). careM looks it up
 * from the applicant's open financial-assistance service and hands it over without any personnummer.
 */
class LifecareServiceIdService {
  private errandService = new CaremanagementErrandService();

  async resolve(errandId: string): Promise<number> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    const serviceId = view.data?.lifecareServiceId;
    // careM sends null, not an absent field, when it found no open insats.
    if (typeof serviceId !== 'number') {
      throw new HttpException(409, 'Sökande har ingen öppen insats för ekonomiskt bistånd i Lifecare');
    }
    return serviceId;
  }
}

export default LifecareServiceIdService;
