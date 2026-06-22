import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** The three approvable EB view sections. */
export type SectionKey = 'CALCULATION' | 'PAYMENT' | 'DECISION';

/** A handläggare's approval of one EB view section. Defined locally mirroring the backend response. */
export interface SectionApproval {
  section?: string;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

/** The approval state of the three EB view sections. */
export interface SectionApprovals {
  calculation?: SectionApproval;
  payment?: SectionApproval;
  decision?: SectionApproval;
}

/** Fetches the approval state of an errand's three sections. */
export const getSectionApprovals = (errandId: string): Promise<ServiceResponse<SectionApprovals>> =>
  apiService
    .get<ApiResponse<SectionApprovals>>(`errands/${errandId}/sections/approvals`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Approves a section or withdraws its approval. */
export const setSectionApproval = (
  errandId: string,
  section: SectionKey,
  approved: boolean
): Promise<ServiceResponse<SectionApproval>> =>
  apiService
    .patch<ApiResponse<SectionApproval>>(`errands/${errandId}/sections/${section}/approval`, { approved })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
