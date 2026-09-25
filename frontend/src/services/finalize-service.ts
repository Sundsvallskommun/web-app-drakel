import { FinalizeApiResponse, FinalizeErrandDto, FinalizeResult } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/**
 * "Skicka beräkning och beslut": finalizes the errand from the beslut saved in Lifecare, then sends the
 * handläggare's message with the beslut, the beräkning and their own PDFs through the chosen channels. A resolved
 * result means the errand is decided — it lists the parts after that which did not go through. A rejection
 * (`error`, with the backend's `message`) means nothing was finalized.
 */
export const finalizeErrand = (
  errandId: string,
  request: FinalizeErrandDto,
  files: File[] = []
): Promise<ServiceResponse<FinalizeResult>> => {
  const form = new FormData();
  form.append('request', JSON.stringify(request));
  files.forEach((file) => {
    form.append('files', file);
  });
  // Empty headers let axios set the multipart boundary instead of the default JSON content-type.
  return apiService
    .post<FinalizeApiResponse>(`errands/${errandId}/finalize`, form, { headers: {} })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};
