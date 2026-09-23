import { LIFECARE_DECISION_PRINT_TEMPLATE_ID } from '@config';
import { HttpException } from '@exceptions/HttpException';
import {
  LifecareCreatedDecisionRaw,
  LifecareDecisionProposalRaw,
  LifecareDecisionReasonRaw,
  LifecareSavedDecisionRaw,
} from '@interfaces/lifecare-decision.interface';

import LifecareApiService from './lifecare-api.service';

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

// Lifecare's businessType for "businessId is an insats".
const SERVICE_BUSINESS_TYPE = '8';

// Lifecare's businessType for "businessId is a beslut".
const DECISION_BUSINESS_TYPE = '4';

// Every PDF starts with these bytes; anything else from the print endpoint is an error page.
const PDF_SIGNATURE = '%PDF';

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

  /** A beslut registered in Lifecare, whole — what `update` takes back. */
  public async readDecision(decisionId: number): Promise<LifecareSavedDecisionRaw> {
    const res = await this.apiService.get<LifecareSavedDecisionRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Decision/GetDecision',
      params: { businessType: DECISION_BUSINESS_TYPE, businessId: String(decisionId) },
    });
    return res.data;
  }

  /**
   * The beslut rendered as PDF by Lifecare's own print template — what the handläggare previews and what
   * is sent to the sökande. Not under api2: it is the page Lifecare's web app opens for "Skriv ut".
   */
  public async printDecision(decisionId: number): Promise<Buffer> {
    const res = await this.apiService.get<ArrayBuffer>({
      module: PROFESSIONAL_WEB,
      path: 'RenderPdf/PrintDecision',
      params: { templateId: LIFECARE_DECISION_PRINT_TEMPLATE_ID, decisionId: String(decisionId), hideRevisions: 'true' },
      responseType: 'arraybuffer',
    });
    const pdf = Buffer.from(res.data);
    if (pdf.subarray(0, PDF_SIGNATURE.length).toString('latin1') !== PDF_SIGNATURE) {
      throw new HttpException(502, 'Lifecare skickade ingen PDF för beslutet');
    }
    return pdf;
  }

  /**
   * Saves changes to a beslut already registered in Lifecare. Lifecare answers with the beslut as it now
   * stands. The body is the read beslut with the changes applied — see buildDecisionUpdate.
   */
  public async update(decisionId: number, decision: Record<string, unknown>): Promise<LifecareSavedDecisionRaw> {
    const res = await this.apiService.post<LifecareSavedDecisionRaw>(
      {
        module: PROFESSIONAL_WEB,
        path: 'api2/Decision/Update',
        params: { businessType: DECISION_BUSINESS_TYPE, businessId: String(decisionId) },
      },
      decision,
    );
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
