import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** Renders HTML to a PDF for preview and returns it as base64. Nothing is saved (used by beslut/beräkning). */
export const renderPdf = (html: string): Promise<ServiceResponse<string>> =>
  apiService
    .post<ApiResponse<{ pdfBase64: string }>>('pdf/render', { html })
    .then((res) => ({ data: res.data.data.pdfBase64 }))
    .catch(toServiceError);
