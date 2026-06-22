import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import {
  CreateJournalEntry,
  JournalEntry,
  JournalEntryMetadata,
  LockJournalEntry,
  UpdateJournalEntry,
} from '@/data-contracts/caremanagement/data-contracts';

/** Owns the journalanteckning (case-journal) sub-resource of an errand. */
class CaremanagementJournalService {
  private apiService = new CaremanagementApiService();

  private entriesUrl(errandId: string, ...rest: string[]): string {
    return caremanagementUrl('errands', errandId, 'journal-entries', ...rest);
  }

  async readEntries(errandId: string): Promise<ApiResponse<JournalEntry[]>> {
    return this.apiService.get<JournalEntry[]>({ url: this.entriesUrl(errandId) });
  }

  async createEntry(errandId: string, body: CreateJournalEntry): Promise<ApiResponse<JournalEntry>> {
    return this.apiService.post<JournalEntry>({ url: this.entriesUrl(errandId), data: body });
  }

  async updateEntry(errandId: string, entryId: string, body: UpdateJournalEntry): Promise<ApiResponse<JournalEntry>> {
    return this.apiService.patch<JournalEntry>({ url: this.entriesUrl(errandId, entryId), data: body });
  }

  /** Locks a WORKING entry into an upprättad handling (no longer editable). */
  async lockEntry(errandId: string, entryId: string, body: LockJournalEntry): Promise<ApiResponse<JournalEntry>> {
    return this.apiService.post<JournalEntry>({ url: this.entriesUrl(errandId, entryId, 'lock'), data: body });
  }

  async deleteEntry(errandId: string, entryId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({ url: this.entriesUrl(errandId, entryId) });
  }

  /** The selectable journal entry types (Lifecare 'Typ' catalogue). */
  async readTypes(): Promise<ApiResponse<JournalEntryMetadata>> {
    return this.apiService.get<JournalEntryMetadata>({ url: caremanagementUrl('errands', 'journal-entries', 'metadata') });
  }
}

export default CaremanagementJournalService;
