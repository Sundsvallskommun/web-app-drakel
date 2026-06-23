import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { CreateNote, Note, NoteCount } from '@/data-contracts/caremanagement/data-contracts';

/** Body accepted by caremanagement's PATCH .../notes/{noteId} (the contract's UpdateNote). */
interface UpdateNote {
  body: string;
}

class CaremanagementNoteService {
  private apiService = new CaremanagementApiService();

  async listNotes(errandId: string): Promise<ApiResponse<Note[]>> {
    return this.apiService.get<Note[]>({ url: caremanagementUrl('errands', errandId, 'notes') });
  }

  /** The note count for the errand (unlogged — safe to poll for a badge). */
  async readCount(errandId: string): Promise<ApiResponse<NoteCount>> {
    return this.apiService.get<NoteCount>({ url: caremanagementUrl('errands', errandId, 'notes', 'count') });
  }

  async createNote(errandId: string, note: CreateNote): Promise<ApiResponse<Note>> {
    return this.apiService.post<Note>({ url: caremanagementUrl('errands', errandId, 'notes'), data: note });
  }

  async updateNote(errandId: string, noteId: string, note: UpdateNote): Promise<ApiResponse<Note>> {
    return this.apiService.patch<Note>({ url: caremanagementUrl('errands', errandId, 'notes', noteId), data: note });
  }

  async deleteNote(errandId: string, noteId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({ url: caremanagementUrl('errands', errandId, 'notes', noteId) });
  }
}

export default CaremanagementNoteService;
