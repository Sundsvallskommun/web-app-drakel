import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import { pickPreviousCalculation } from '@utils/previous-calculation';

import { PreviousCalculationView, toPreviousCalculationView } from '@/responses/previous-calculation.response';

// The stakeholder whose Lifecare calculations the "previous normberäkning" concerns.
const APPLICANT_ROLE = 'APPLICANT';

/**
 * The applicant's beräkning preceding the errand's own period, read from Lifecare — the "Jämför med
 * föregående månad" view.
 *
 * Which beräkning that is still comes from careM's list of the applicant's Lifecare beräkningar: Lifecare's
 * own list for an insats is not captured yet. Its content — rows, sums, period — is read from Lifecare.
 */
class ErrandPreviousCalculationService {
  private stakeholders = new CaremanagementStakeholderService();
  private normberakning = new CaremanagementNormberakningService();
  private calculations = new LifecareCalculationsService();
  private accessLog = new LifecareAccessLogService();

  /** The previous beräkning, or null when the applicant has none before the errand's period. */
  async read(errandId: string): Promise<PreviousCalculationView | null> {
    // The calculation list is keyed on the person, not the errand, so the APPLICANT stakeholder's
    // externalId (partyId) has to be resolved first. The draft supplies the period to be "before".
    const [stakeholdersRes, draftRes] = await Promise.all([
      this.stakeholders.readStakeholders(errandId),
      this.normberakning.readDraft(errandId).catch(() => undefined),
    ]);
    const applicant = stakeholdersRes.data?.find(stakeholder => stakeholder.role === APPLICANT_ROLE)?.externalId;
    if (!applicant) {
      return null;
    }

    const listed = await this.normberakning.listCalculations(applicant);
    const previousId = pickPreviousCalculation(listed.data ?? [], draftRes?.data?.calculationFromDate)?.id;
    if (previousId === undefined) {
      return null;
    }

    const previous = await this.calculations.read(previousId);
    await this.accessLog.logRead(errandId, {
      target: 'CALCULATION',
      description: 'Läste föregående normberäkning i Lifecare',
      lifecareId: String(previousId),
    });
    return toPreviousCalculationView(previous);
  }
}

export default ErrandPreviousCalculationService;
