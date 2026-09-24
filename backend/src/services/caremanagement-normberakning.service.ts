import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { CalculationDraft, NormExpenseRow, NormIncomeRow, NormPersonRow } from '@/data-contracts/caremanagement/data-contracts';
import { NormHeaderInputDto, NormRowInputDto } from '@/dtos/normberakning.dto';

import CitizenService from './citizen.service';

/** The three editable sections of the draft normberäkning. */
export type NormSection = 'persons' | 'incomes' | 'expenses';

type NormRow = NormPersonRow | NormIncomeRow | NormExpenseRow;

/** A person row enriched with the personnummer resolved from its partyId via the Citizen API. */
type EnrichedNormPersonRow = NormPersonRow & { personalNumber?: string };

/** The draft as handed to the frontend — same shape, but every person row carries its personnummer. */
type EnrichedCalculationDraft = Omit<CalculationDraft, 'persons'> & { persons?: EnrichedNormPersonRow[] };

/**
 * The draft normberäkning lives under the financial-assistance view. It has three sections (persons ·
 * incomes · expenses); each is edited one row at a time (add/patch/soft-delete/restore). The process
 * values are system-owned; handläggare only set their own value/note.
 */
class CaremanagementNormberakningService {
  private apiService = new CaremanagementApiService();
  private citizenService = new CitizenService();

  private draftUrl(errandId: string, ...rest: string[]): string {
    return caremanagementUrl('errands', 'financial-assistance', errandId, 'calculation', 'draft', ...rest);
  }

  async readDraft(errandId: string): Promise<ApiResponse<EnrichedCalculationDraft>> {
    const res = await this.apiService.get<CalculationDraft>({ url: this.draftUrl(errandId) });
    const persons = await Promise.all((res.data?.persons ?? []).map(person => this.withPersonalNumber(person)));
    return { ...res, data: { ...res.data, persons } };
  }

  /**
   * Whether the handläggare overrode the household size on the draft — what finalize forwards as
   * `householdSizeChanged`. Reads the draft as it is, without resolving personnummer for its persons.
   */
  async readHouseholdSizeChanged(errandId: string): Promise<boolean> {
    const res = await this.apiService.get<CalculationDraft>({ url: this.draftUrl(errandId) });
    return res.data?.hasCustomHouseholdSize ?? false;
  }

  /**
   * Adds the personnummer (resolved from the row's partyId) to a person row — the handläggare identifies a
   * household member by personnummer, the way Lifecare's Beräkning view does, and the draft only carries the
   * partyId. Best-effort: a row without a partyId, or one the Citizen API cannot resolve, keeps no number.
   */
  private async withPersonalNumber(person: NormPersonRow): Promise<EnrichedNormPersonRow> {
    if (!person.partyId) {
      return person;
    }
    const personalNumber = await this.citizenService.getPersonnumber(person.partyId);
    return personalNumber ? { ...person, personalNumber } : person;
  }

  /** Updates the draft header (norm, calculation dates, household size). */
  async updateHeader(errandId: string, input: NormHeaderInputDto): Promise<ApiResponse<CalculationDraft>> {
    return this.apiService.patch<CalculationDraft>({ url: this.draftUrl(errandId, 'header'), data: input });
  }

  /** Adds a handläggare row to a section. */
  async addRow(errandId: string, section: NormSection, input: NormRowInputDto): Promise<ApiResponse<NormRow>> {
    return this.apiService.post<NormRow>({ url: this.draftUrl(errandId, section), data: input });
  }

  /** Sets the handläggare value/note on a row. */
  async updateRow(errandId: string, section: NormSection, rowId: string, input: NormRowInputDto): Promise<ApiResponse<NormRow>> {
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

  /** The first day of the draft's period, read as the draft is — without resolving personnummer for its persons. */
  async readPeriodStart(errandId: string): Promise<string | undefined> {
    const res = await this.apiService.get<CalculationDraft>({ url: this.draftUrl(errandId) });
    return res.data?.calculationFromDate;
  }
}

export default CaremanagementNormberakningService;
