import { HttpException } from '@exceptions/HttpException';
import CaremanagementApiService from '@services/caremanagement-api.service';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import { caremanagementLifecareUrl, caremanagementUrl } from '@utils/caremanagement-url';
import { logger } from '@utils/logger';
import { succeedsWithin } from '@utils/retry';

import {
  DecisionLifecareResultOutcomeEnum,
  LifecareDecisionReason as CaremanagementDecisionReason,
  LifecareDecisionSaveRequest,
  LifecareDecisionType as CaremanagementDecisionType,
  LifecareDecisionView as CaremanagementDecisionView,
} from '@/data-contracts/caremanagement/data-contracts';
import { SaveLifecareDecisionDto } from '@/dtos/lifecare-decision.dto';
import { DecisionRegistration } from '@/responses/decision-registration.response';
import {
  LifecareDecisionReasonView,
  LifecareDecisionTypeView,
  LifecareDecisionView,
  toDecisionReasonView,
  toDecisionTypeView,
  toLifecareDecisionView,
} from '@/responses/lifecare-decision.response';

// Calls to careM that must not be lost to a single hiccup are tried this many times.
const CAREM_ATTEMPTS = 3;

/**
 * The errand's beslut, kept in Lifecare and reached through careM. careM signs in to Lifecare, finds the errand's
 * insats and beslut, links a new beslut to the errand and logs every access itself; the BFF only passes the calls
 * on. The handläggare's Spara is careM's save — `Decision/Create` the first time, `Decision/Update` after that —
 * and careM refuses a beslut that cannot be saved, in words the handläggare can act on.
 */
class ErrandLifecareDecisionService {
  private apiService = new CaremanagementApiService();
  private caremanagementDecisions = new CaremanagementDecisionService();

  /** The errand's beslut as it stands in Lifecare, or undefined while none has been saved. */
  async read(errandId: string): Promise<LifecareDecisionView | undefined> {
    const decision = await this.apiService.getOrNull<CaremanagementDecisionView>({ url: caremanagementLifecareUrl(errandId, 'decision') });
    return decision === null ? undefined : toLifecareDecisionView(decision);
  }

  /** The beslutstyper the errand's insats offers — Lifecare's own list. */
  async types(errandId: string): Promise<LifecareDecisionTypeView[]> {
    const types = await this.apiService.get<CaremanagementDecisionType[]>({ url: caremanagementLifecareUrl(errandId, 'decision', 'types') });
    return types.data.map(toDecisionTypeView);
  }

  /** The orsaker a beslut of the type can carry — Lifecare's catalogue, which belongs to the type, not a person. */
  async reasons(decisionCode: number): Promise<LifecareDecisionReasonView[]> {
    if (!Number.isInteger(decisionCode)) {
      throw new HttpException(400, 'The beslutstyp code must be a whole number');
    }
    const reasons = await this.apiService.get<CaremanagementDecisionReason[]>({
      url: caremanagementUrl('errands', 'financial-assistance', 'lifecare', 'decision-types', String(decisionCode), 'reasons'),
    });
    return reasons.data.map(toDecisionReasonView);
  }

  /**
   * Saves the beslut in Lifecare: careM creates it the first time and links the errand to it, and changes the same
   * beslut every time after. The beslutsfattare is the handläggare saving it (the X-Sent-By careM is called with).
   */
  async save(errandId: string, input: SaveLifecareDecisionDto): Promise<LifecareDecisionView> {
    const saved = await this.apiService.put<CaremanagementDecisionView>({
      url: caremanagementLifecareUrl(errandId, 'decision'),
      data: input satisfies LifecareDecisionSaveRequest,
    });
    return toLifecareDecisionView(saved.data);
  }

  /** The errand's beslut as Lifecare prints it — for the preview and for what is sent to the sökande. */
  async pdf(errandId: string): Promise<Buffer> {
    return this.apiService.getBinary({ url: caremanagementLifecareUrl(errandId, 'decision', 'pdf') });
  }

  /**
   * Tells careM that the beslut its finalize recorded is this Lifecare beslut. The beslut is already in
   * Lifecare, so this only links the two; a receipt careM never takes is reported, never thrown.
   */
  async receiptFinalized(errandId: string, finalizedDecisionId: string, lifecareDecisionId: number): Promise<DecisionRegistration> {
    const lifecareId = String(lifecareDecisionId);
    const receipted = await succeedsWithin(
      CAREM_ATTEMPTS,
      () =>
        this.caremanagementDecisions.reportLifecareResult(errandId, finalizedDecisionId, {
          outcome: DecisionLifecareResultOutcomeEnum.WRITTEN,
          lifecareId,
        }),
      attempt => {
        logger.warn(`Could not link decision ${finalizedDecisionId} on errand ${errandId} to its Lifecare beslut (attempt ${String(attempt)})`);
      },
    );
    return receipted
      ? { decisionId: finalizedDecisionId, outcome: 'REGISTERED', lifecareId }
      : {
          decisionId: finalizedDecisionId,
          outcome: 'REGISTERED',
          lifecareId,
          detail: `Beslutet finns i Lifecare (beslut ${lifecareId}) men kunde inte kvitteras i careM.`,
        };
  }
}

export default ErrandLifecareDecisionService;
