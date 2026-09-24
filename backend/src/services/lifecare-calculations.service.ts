import { LIFECARE_CALCULATION_PRINT_TEMPLATE_ID } from '@config';
import { HttpException } from '@exceptions/HttpException';
import {
  LifecareCalculationForEditRaw,
  LifecareCalculationListItemRaw,
  LifecareCalculationProposalRaw,
  LifecareCalculationRaw,
  LifecareNormSharedRaw,
  LifecarePlacedPersonsRaw,
} from '@interfaces/lifecare-calculation.interface';
import { LifecareJobStimulusRaw } from '@interfaces/lifecare-job-stimulus.interface';
import { withNormRowNames, withPlacedPersons } from '@utils/lifecare-calculation';
import { isPdf } from '@utils/pdf-signature';

import LifecareApiService from './lifecare-api.service';

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

// Lifecare's businessType for "businessId is an insats".
const SERVICE_BUSINESS_TYPE = '8';

// Lifecare's businessType for "businessId is a beräkning".
const CALCULATION_BUSINESS_TYPE = '3';

// The print container's owner for a beräkning, as Lifecare's web app asks for it. The owner code is the one
// the web app sends for every beräkning (URL from verksamheten, 2026-09-24); what it stands for is not known.
const CALCULATION_OWNER_TYPE = 'BERAK';
const CALCULATION_OWNER_CODE = '999999999';

/** Lifecare's normberäkning endpoints, with paths and query strings copied from captures of its web app. */
class LifecareCalculationsService {
  private readonly apiService = new LifecareApiService();

  /** The underlag for a new beräkning on the insats: a blank one with the household, and the catalogues. */
  public async readProposal(serviceId: number): Promise<LifecareCalculationProposalRaw> {
    const res = await this.apiService.get<LifecareCalculationProposalRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Calculation/GetProposalService',
      params: { businessType: SERVICE_BUSINESS_TYPE, businessId: String(serviceId) },
    });
    return res.data;
  }

  /** Every beräkning on the insats, newest first, without rows (capture 2026-09-24). */
  public async listForService(serviceId: number): Promise<LifecareCalculationListItemRaw[]> {
    const res = await this.apiService.get<LifecareCalculationListItemRaw[]>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Calculation/ListCalculations',
      params: {
        businessType: SERVICE_BUSINESS_TYPE,
        businessId: String(serviceId),
        investigationId: '0',
        serviceId: String(serviceId),
        onlylatest: 'true',
      },
    });
    return res.data;
  }

  /** A saved beräkning as Lifecare shows it: rows, period and its summering. */
  public async read(calculationId: number): Promise<LifecareCalculationRaw> {
    const res = await this.apiService.get<LifecareCalculationRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Calculation/GetCalculation',
      params: { businessType: CALCULATION_BUSINESS_TYPE, businessId: String(calculationId) },
    });
    return res.data;
  }

  /** A saved beräkning, whole — what `update` takes back — with the catalogues. */
  public async readForEdit(calculationId: number): Promise<LifecareCalculationForEditRaw> {
    const res = await this.apiService.get<LifecareCalculationForEditRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Calculation/GetCalculationForEdit',
      params: { businessType: CALCULATION_BUSINESS_TYPE, businessId: String(calculationId) },
    });
    return res.data;
  }

  /** Places the members on the norm's rows for the period — Lifecare picks each row and its amount. */
  public async placePersons(body: Record<string, unknown>): Promise<LifecarePlacedPersonsRaw> {
    const res = await this.apiService.post<LifecarePlacedPersonsRaw>({ module: PROFESSIONAL_WEB, path: 'api2/Calculation/PlacePersons' }, body);
    return res.data;
  }

  /**
   * A member's amount on the norm for the period, as Lifecare counts it from the member's normintervall and
   * days in the household — what the web app asks for a member before it saves (capture 2026-09-24, lifecare7:
   * normintervall 11 on Riksnorm 2026 gave 3 820).
   *
   * The request names no norm: Lifecare counts on the norm of the session's latest `PlacePersons` — the same
   * row id is a different amount on another norm. Call it right after placing the beräkning's members.
   */
  public async amountFor(person: Record<string, unknown>, startDate: string, endDate: string): Promise<number> {
    const res = await this.apiService.post<{ amount: number }>(
      { module: PROFESSIONAL_WEB, path: 'api2/Calculation/GetAmount' },
      { person, startDate, endDate },
    );
    return res.data.amount;
  }

  /** The gemensamma kostnader of a household of the norm row's size over the period, as Lifecare counts them. */
  public async sharedCost(startDate: string, endDate: string, normShared: LifecareNormSharedRaw): Promise<number> {
    const res = await this.apiService.post<number>(
      { module: PROFESSIONAL_WEB, path: 'api2/Calculation/GetSharedCost' },
      { startDate, endDate, normShared },
    );
    return res.data;
  }

  /** Marks which members have jobbstimulans during the beräkning's period, as the web app asks before saving. */
  public async withJobStimuli(calculation: Record<string, unknown>, jobStimulus: LifecareJobStimulusRaw): Promise<LifecareCalculationRaw> {
    const res = await this.apiService.post<LifecareCalculationRaw>(
      { module: PROFESSIONAL_WEB, path: 'api2/Calculation/GetJobStimuliForCalculation' },
      { calculation, jobStimulus },
    );
    return res.data;
  }

  /**
   * Has Lifecare place the included members on the norm for the period and mark who has jobbstimulans in it —
   * what the web app asks before every save. Members left out are taken off the norm.
   */
  public async placeAndMark(
    calculation: LifecareCalculationRaw,
    jobStimulus: LifecareJobStimulusRaw,
    keepPlacements = true,
  ): Promise<LifecareCalculationRaw> {
    const placed = await this.placePersons({
      startDate: calculation.startDate,
      endDate: calculation.endDate,
      normId: calculation.normId,
      calculationPersons: calculation.calculationPersons.filter(person => person.included),
    });
    // The norm comes back with its rows and gemensamma kostnader — the new one's, when the norm was changed.
    const withNorm = withNormRowNames({
      ...withPlacedPersons(calculation, placed.calculationPersons, keepPlacements),
      norm: placed.norm ?? calculation.norm,
    });
    const marked = await this.withJobStimuli(withNorm, jobStimulus);
    return { ...withNorm, hasApplicantJobStimuli: marked.hasApplicantJobStimuli, hasCoApplicantJobStimuli: marked.hasCoApplicantJobStimuli };
  }

  /**
   * The beräkning rendered as PDF by Lifecare's own print template — what the handläggare previews. Not under
   * api2: it is the page Lifecare's web app opens to print a beräkning (`RenderPdf/PrintContainer`, owner BERAK).
   */
  public async printCalculation(calculationId: number): Promise<Buffer> {
    const res = await this.apiService.get<ArrayBuffer>({
      module: PROFESSIONAL_WEB,
      path: 'RenderPdf/PrintContainer',
      params: {
        templateId: LIFECARE_CALCULATION_PRINT_TEMPLATE_ID,
        ownerType: CALCULATION_OWNER_TYPE,
        ownerCode: CALCULATION_OWNER_CODE,
        objectId: String(calculationId),
      },
      responseType: 'arraybuffer',
    });
    const pdf = Buffer.from(res.data);
    if (!isPdf(pdf)) {
      throw new HttpException(502, 'Lifecare skickade ingen PDF för normberäkningen');
    }
    return pdf;
  }

  /** Creates a beräkning on the insats. Not idempotent: a second call makes a second beräkning. */
  public async create(serviceId: number, body: Record<string, unknown>): Promise<LifecareCalculationRaw> {
    const res = await this.apiService.post<LifecareCalculationRaw>(
      {
        module: PROFESSIONAL_WEB,
        path: 'api2/Calculation/Create',
        params: { businessType: SERVICE_BUSINESS_TYPE, businessId: String(serviceId) },
      },
      body,
    );
    return res.data;
  }

  /** Saves changes to a beräkning. Lifecare answers with the beräkning recounted. */
  public async update(calculationId: number, body: Record<string, unknown>): Promise<LifecareCalculationRaw> {
    const res = await this.apiService.post<LifecareCalculationRaw>(
      {
        module: PROFESSIONAL_WEB,
        path: 'api2/Calculation/Update',
        params: { businessType: CALCULATION_BUSINESS_TYPE, businessId: String(calculationId) },
      },
      body,
    );
    return res.data;
  }
}

export default LifecareCalculationsService;
