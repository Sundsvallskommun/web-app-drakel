import { RenderPdfDto } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, mapData } from '@services/api-service';

/** Renders HTML to a PDF for preview and returns it as base64. Nothing is saved (used by beslut/beräkning). */
export const renderPdf = (html: string): Promise<ServiceResponse<string>> => {
  const request: RenderPdfDto = { html };
  return mapData(
    apiService.post<ApiResponse<{ pdfBase64: string }>>('pdf/render', request),
    (rendered) => rendered.pdfBase64
  );
};
