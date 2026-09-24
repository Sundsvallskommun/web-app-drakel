import {
  LifecareCalculationForEditRaw,
  LifecareCalculationPersonRaw,
  LifecareCalculationProposalRaw,
  LifecareCalculationRaw,
  LifecarePlacedPersonsRaw,
} from '@interfaces/lifecare-calculation.interface';
import { LifecareJobStimulusRaw } from '@interfaces/lifecare-job-stimulus.interface';
import { withPlacedPersons } from '@utils/lifecare-calculation';

import LifecareApiService from './lifecare-api.service';

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

// Lifecare's businessType for "businessId is an insats".
const SERVICE_BUSINESS_TYPE = '8';

// Lifecare's businessType for "businessId is a beräkning".
const CALCULATION_BUSINESS_TYPE = '3';

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
  public async placeAndMark(calculation: LifecareCalculationRaw, jobStimulus: LifecareJobStimulusRaw): Promise<LifecareCalculationRaw> {
    const placed = await this.placePersons({
      startDate: calculation.startDate,
      endDate: calculation.endDate,
      normId: calculation.normId,
      calculationPersons: calculation.calculationPersons.filter(person => person.included),
    });
    const withNorm = withPlacedPersons(calculation, placed.calculationPersons);
    const marked = await this.withJobStimuli(withNorm, jobStimulus);
    return { ...withNorm, hasApplicantJobStimuli: marked.hasApplicantJobStimuli, hasCoApplicantJobStimuli: marked.hasCoApplicantJobStimuli };
  }

  /**
   * A person as a new member of the beräkning — the row Lifecare's web app adds when a person is taken in
   * (capture 2026-09-24). `body` names the beräkning's period, norm and date and the person.
   */
  public async proposalForPerson(body: Record<string, unknown>): Promise<LifecareCalculationPersonRaw> {
    const res = await this.apiService.post<LifecareCalculationPersonRaw>(
      { module: PROFESSIONAL_WEB, path: 'api2/Calculation/GetProposalForPerson' },
      body,
    );
    return res.data;
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
