import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import {
  NormberakningDraft,
  NormExpenseRow,
  NormIncomeRow,
  NormPersonRow,
} from '@/data-contracts/caremanagement/data-contracts';
import { NormRowInputDto } from '@/dtos/normberakning.dto';

/** The three editable sections of the draft normberäkning. */
export type NormSection = 'persons' | 'incomes' | 'expenses';

type NormRow = NormPersonRow | NormIncomeRow | NormExpenseRow;

/**
 * The draft normberäkning lives under the financial-assistance view. It has three sections (persons ·
 * incomes · expenses); each is edited one row at a time (add/patch/soft-delete/restore). The process
 * values are system-owned; handläggare only set their own value/note.
 */
class CaremanagementNormberakningService {
  private apiService = new CaremanagementApiService();

  private draftUrl(errandId: string, ...rest: string[]): string {
    return caremanagementUrl('errands', 'financial-assistance', errandId, 'normberakning', 'draft', ...rest);
  }

  async readDraft(errandId: string): Promise<ApiResponse<NormberakningDraft>> {
    return this.apiService.get<NormberakningDraft>({ url: this.draftUrl(errandId) });
  }

  /** Adds a handläggare row to a section. */
  async addRow(errandId: string, section: NormSection, input: NormRowInputDto): Promise<ApiResponse<NormRow>> {
    return this.apiService.post<NormRow>({ url: this.draftUrl(errandId, section), data: input });
  }

  /** Sets the handläggare value/note on a row. */
  async updateRow(
    errandId: string,
    section: NormSection,
    rowId: string,
    input: NormRowInputDto
  ): Promise<ApiResponse<NormRow>> {
    return this.apiService.patch<NormRow>({ url: this.draftUrl(errandId, section, rowId), data: input });
  }

  /** Soft-deletes a row. */
  async deleteRow(errandId: string, section: NormSection, rowId: string): Promise<ApiResponse<NormRow>> {
    return this.apiService.delete<NormRow>({ url: this.draftUrl(errandId, section, rowId) });
  }

  /** Restores a soft-deleted row. */
  async restoreRow(errandId: string, section: NormSection, rowId: string): Promise<ApiResponse<NormRow>> {
    return this.apiService.post<NormRow>({ url: this.draftUrl(errandId, section, rowId, 'restore') });
  }
}

export default CaremanagementNormberakningService;
