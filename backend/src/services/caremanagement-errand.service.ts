import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Errand, FinancialAssistanceView, FindErrandsResponse, PatchErrand } from '@/data-contracts/caremanagement/data-contracts';
import { CreateErrandDto, FindErrandsQueryDto, PatchErrandDto } from '@/dtos/errand.dto';
import { HttpException } from '@/exceptions/HttpException';

/** Extracts the errand id (last path segment) from a caremanagement Location header. */
const errandIdFromLocation = (location?: string): string | undefined => location?.split('/').filter(Boolean).pop();
const isUuid = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const filterString = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

class CaremanagementErrandService {
  private apiService = new CaremanagementApiService();

  async findErrands(query: FindErrandsQueryDto): Promise<ApiResponse<FindErrandsResponse>> {
    // `indexes: null` serializes array params as repeated keys (sort=a&sort=b) rather than axios's default
    // bracket form (sort[]=a), which is the form caremanagement (Spring) expects for ?sort.
    return this.apiService.get<FindErrandsResponse>({
      url: caremanagementUrl('errands'),
      params: query,
      paramsSerializer: { indexes: null },
    });
  }

  async getErrand(errandId: string): Promise<ApiResponse<Errand>> {
    return this.apiService.get<Errand>({ url: caremanagementUrl('errands', errandId) });
  }

  async getErrandByIdentifier(identifier: string): Promise<ApiResponse<Errand>> {
    if (isUuid(identifier)) {
      return this.getErrand(identifier);
    }

    const res = await this.findErrands({
      filter: `errandNumber:'${filterString(identifier)}'`,
      page: 0,
      size: 1,
    });
    const errand = res.data.errands?.[0];
    if (!errand) {
      throw new HttpException(404, 'Not found');
    }
    return { data: errand, message: 'success' };
  }

  /**
   * Fetches the financial-assistance view of an errand, which (unlike the generic GET /errands/{id})
   * includes the submitted `data` payload. Used for the "Ärendeuppgifter"-tab.
   */
  async getFinancialAssistanceView(errandId: string): Promise<ApiResponse<FinancialAssistanceView>> {
    return this.apiService.get<FinancialAssistanceView>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId),
    });
  }

  async createErrand(errand: CreateErrandDto): Promise<ApiResponse<Errand>> {
    // caremanagement returns "201 Created" with a Location header and an empty body, so we resolve
    // the created errand by the id in that Location and return the full errand to the caller.
    const created = await this.apiService.post<Errand>({ url: caremanagementUrl('errands'), data: errand });
    const errandId = errandIdFromLocation(created.location);
    return errandId ? this.getErrand(errandId) : created;
  }

  async updateErrand(errandId: string, patch: PatchErrandDto): Promise<ApiResponse<Errand>> {
    const body: PatchErrand = patch;
    return this.apiService.patch<Errand>({ url: caremanagementUrl('errands', errandId), data: body });
  }

  async deleteErrand(errandId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({ url: caremanagementUrl('errands', errandId) });
  }
}

export default CaremanagementErrandService;
