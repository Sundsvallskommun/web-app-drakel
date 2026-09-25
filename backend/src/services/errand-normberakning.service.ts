import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import {
  AddNormberakningRowParamsSectionEnum,
  NormberakningDraft as CaremanagementNormberakningDraft,
  NormberakningTypes as CaremanagementNormberakningTypes,
} from '@/data-contracts/caremanagement/data-contracts';
import { NormHeaderInputDto, NormRowInputDto } from '@/dtos/normberakning.dto';
import { NormberakningDraft, NormberakningTypes, toNormberakningDraft, toNormberakningTypes } from '@/responses/normberakning.response';

/** The three editable sections of the normberäkning, as careM's routes name them: persons · incomes · expenses. */
export type NormSection = `${AddNormberakningRowParamsSectionEnum}`;

/** The errand's Normberäkning route in careM, e.g. `normberakningUrl(errandId, 'incomes', rowId)`. */
const normberakningUrl = (errandId: string, ...parts: string[]): string => caremanagementLifecareUrl(errandId, 'normberakning', ...parts);

/**
 * The Normberäkning tab's rows, read and changed through careM. careM decides where they are kept — its own draft
 * until the beräkning is first saved in Lifecare, Lifecare's beräkning after that — and refuses (422) a change that
 * cannot be made there, e.g. a person added to a beräkning in Lifecare. Each section is edited one row at a time.
 */
class ErrandNormberakningService {
  private apiService = new CaremanagementApiService();

  async readDraft(errandId: string): Promise<NormberakningDraft> {
    const response = await this.apiService.get<CaremanagementNormberakningDraft>({ url: normberakningUrl(errandId) });
    return toNormberakningDraft(response.data);
  }

  /** The norms and the inkomst- and kostnadstyper a new row can have: Lifecare's once the beräkning is there, careM's before. */
  async types(errandId: string): Promise<NormberakningTypes> {
    const response = await this.apiService.get<CaremanagementNormberakningTypes>({ url: normberakningUrl(errandId, 'types') });
    return toNormberakningTypes(response.data);
  }

  /** Changes the header: in careM's draft the norm, the dates and the household size; in Lifecare the norm and the household size. */
  async updateHeader(errandId: string, input: NormHeaderInputDto): Promise<void> {
    await this.apiService.patch({ url: normberakningUrl(errandId, 'header'), data: input });
  }

  async addRow(errandId: string, section: NormSection, input: NormRowInputDto): Promise<void> {
    await this.apiService.post({ url: normberakningUrl(errandId, section), data: input });
  }

  async updateRow(errandId: string, section: NormSection, rowId: string, input: NormRowInputDto): Promise<void> {
    await this.apiService.patch({ url: normberakningUrl(errandId, section, rowId), data: input });
  }

  /** A soft delete in careM's draft; in Lifecare the row is dropped. */
  async deleteRow(errandId: string, section: NormSection, rowId: string): Promise<void> {
    await this.apiService.delete({ url: normberakningUrl(errandId, section, rowId) });
  }

  /** Restores a soft-deleted row of careM's draft; a beräkning in Lifecare has no soft delete. */
  async restoreRow(errandId: string, section: NormSection, rowId: string): Promise<void> {
    await this.apiService.post({ url: normberakningUrl(errandId, section, rowId, 'restore') });
  }
}

export default ErrandNormberakningService;
