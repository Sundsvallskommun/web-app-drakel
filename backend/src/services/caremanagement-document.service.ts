import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import {
  CreateDocument,
  Document,
  DocumentMetadata,
  LockDocument,
  UpdateDocument,
} from '@/data-contracts/caremanagement/data-contracts';

/** Owns the Dokument (formal case document) sub-resource of an errand. */
class CaremanagementDocumentService {
  private apiService = new CaremanagementApiService();

  private documentsUrl(errandId: string, ...rest: string[]): string {
    return caremanagementUrl('errands', errandId, 'documents', ...rest);
  }

  async readDocuments(errandId: string): Promise<ApiResponse<Document[]>> {
    return this.apiService.get<Document[]>({ url: this.documentsUrl(errandId) });
  }

  async createDocument(errandId: string, body: CreateDocument): Promise<ApiResponse<Document>> {
    return this.apiService.post<Document>({ url: this.documentsUrl(errandId), data: body });
  }

  async updateDocument(errandId: string, documentId: string, body: UpdateDocument): Promise<ApiResponse<Document>> {
    return this.apiService.patch<Document>({ url: this.documentsUrl(errandId, documentId), data: body });
  }

  /** Locks a WORKING document into an upprättad handling (no longer editable). */
  async lockDocument(errandId: string, documentId: string, body: LockDocument): Promise<ApiResponse<Document>> {
    return this.apiService.post<Document>({ url: this.documentsUrl(errandId, documentId, 'lock'), data: body });
  }

  async deleteDocument(errandId: string, documentId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({ url: this.documentsUrl(errandId, documentId) });
  }

  /** The selectable document types (Lifecare 'Typ'/Dokumenttyp catalogue). */
  async readTypes(): Promise<ApiResponse<DocumentMetadata>> {
    return this.apiService.get<DocumentMetadata>({ url: caremanagementUrl('errands', 'documents', 'metadata') });
  }
}

export default CaremanagementDocumentService;
