import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, discardData, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/**
 * A caseworker note on an errand (caremanagement Note). `modified*` exist once a note is edited. Defined locally:
 * the backend's contract only describes the note inputs (CreateNoteDto/UpdateNoteDto), not the note itself.
 */
export interface Note {
  id?: string;
  errandId?: string;
  body?: string;
  author?: string;
  created?: string;
  modified?: string;
  modifiedBy?: string;
}

export const getNotes = (errandId: string): Promise<ServiceResponse<Note[]>> =>
  unwrapData(apiService.get<ApiResponse<Note[]>>(apiPath`errands/${errandId}/notes`));

export const createNote = (errandId: string, body: string): Promise<ServiceResponse<null>> =>
  discardData(apiService.post(apiPath`errands/${errandId}/notes`, { body }));

export const updateNote = (errandId: string, noteId: string, body: string): Promise<ServiceResponse<null>> =>
  discardData(apiService.patch(apiPath`errands/${errandId}/notes/${noteId}`, { body }));

export const deleteNote = (errandId: string, noteId: string): Promise<ServiceResponse<null>> =>
  discardData(apiService.delete(apiPath`errands/${errandId}/notes/${noteId}`));
