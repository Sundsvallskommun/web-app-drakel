import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A caseworker note on an errand (caremanagement Note). `modified*` exist once a note is edited. */
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
  apiService
    .get<ApiResponse<Note[]>>(`errands/${errandId}/notes`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

export const createNote = (errandId: string, body: string): Promise<ServiceResponse<null>> =>
  apiService
    .post<ApiResponse<Note>>(`errands/${errandId}/notes`, { body })
    .then(() => ({ data: null }))
    .catch(toServiceError);

export const updateNote = (errandId: string, noteId: string, body: string): Promise<ServiceResponse<null>> =>
  apiService
    .patch<ApiResponse<Note>>(`errands/${errandId}/notes/${noteId}`, { body })
    .then(() => ({ data: null }))
    .catch(toServiceError);

export const deleteNote = (errandId: string, noteId: string): Promise<ServiceResponse<null>> =>
  apiService
    .delete<ApiResponse<null>>(`errands/${errandId}/notes/${noteId}`)
    .then(() => ({ data: null }))
    .catch(toServiceError);
