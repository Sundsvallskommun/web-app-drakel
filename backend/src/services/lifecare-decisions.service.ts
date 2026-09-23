import { LifecareCreatedDecisionRaw, LifecareDecisionProposalRaw, LifecareDecisionReasonRaw } from '@interfaces/lifecare-decision.interface';

import LifecareApiService from './lifecare-api.service';

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

// Lifecare's businessType for "businessId is an insats".
const SERVICE_BUSINESS_TYPE = '8';

/**
 * Lifecare's beslut endpoints, with paths and query strings copied from captures of its own web app
 * (2026-09-23) — no trailing slash on either.
 */
class LifecareDecisionsService {
  private readonly apiService = new LifecareApiService();

  /** The underlag for a new beslut on the insats: the blank beslut, beslutstyper and beslutsfattare. */
  public async readProposal(serviceId: number): Promise<LifecareDecisionProposalRaw> {
    const res = await this.apiService.get<LifecareDecisionProposalRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Decision/GetProposalForService',
      params: { businessType: SERVICE_BUSINESS_TYPE, businessId: String(serviceId), amountType: '', calculationId: '0', proposalId: '0' },
    });
    return res.data;
  }

  /** Lifecare's orsak catalogue for a beslutstyp — `id` is the beslutstyp's code, not the insats. */
  public async readReasons(decisionCode: number): Promise<LifecareDecisionReasonRaw[]> {
    const res = await this.apiService.get<LifecareDecisionReasonRaw[]>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Decision/GetMappedDecisionReasons',
      params: { id: String(decisionCode) },
    });
    return res.data;
  }

  /**
   * Registers a beslut on the insats. Not idempotent — a second call makes a second beslut — and a beslut
   * that leaves someone out is accepted without complaint, so the body is checked before it gets here.
   */
  public async create(serviceId: number, decision: Record<string, unknown>): Promise<LifecareCreatedDecisionRaw> {
    const res = await this.apiService.post<LifecareCreatedDecisionRaw>(
      {
        module: PROFESSIONAL_WEB,
        path: 'api2/Decision/Create',
        params: { businessType: SERVICE_BUSINESS_TYPE, businessId: String(serviceId) },
      },
      decision,
    );
    return res.data;
  }
}

export default LifecareDecisionsService;
