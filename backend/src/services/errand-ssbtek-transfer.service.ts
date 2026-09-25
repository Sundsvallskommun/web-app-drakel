import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementSsbtekChangesService from '@services/caremanagement-ssbtek-changes.service';
import ErrandNormberakningService from '@services/errand-normberakning.service';
import { httpStatusOf } from '@utils/http-error-status';
import { logger } from '@utils/logger';
import { incomeTransferFor, NO_SSBTEK_CHANGES, toSsbtekChangesView } from '@utils/ssbtek-changes';

import { AppliedSsbtekChange, SsbtekChanges } from '@/data-contracts/caremanagement/data-contracts';
import { SsbtekTransferDto } from '@/dtos/ssbtek-transfer.dto';
import { HttpException } from '@/exceptions/HttpException';
import { SsbtekChangesView } from '@/responses/ssbtek-changes.response';

const NOT_FOUND = 404;
const CONFLICT = 409;

/**
 * Transfers incomes from SSBTEK into the errand's normberäkning, as careM's comparison of the two offers them: only an
 * income the normberäkning lacks, and only once — careM records what was written (its spärr).
 */
class ErrandSsbtekTransferService {
  private errandService = new CaremanagementErrandService();
  private changesService = new CaremanagementSsbtekChangesService();
  private normberakning = new ErrandNormberakningService();

  /** What SSBTEK and the normberäkning disagree on; nothing while the normberäkning is not saved in Lifecare. */
  async readChanges(errandIdentifier: string): Promise<SsbtekChangesView> {
    const changes = await this.readRawChanges(await this.errandIdOf(errandIdentifier));
    return changes ? toSsbtekChangesView(changes) : NO_SSBTEK_CHANGES;
  }

  /**
   * Writes the picked incomes into the normberäkning — SSBTEK's amounts, one row per income type — then tells careM
   * what was written, and answers with the comparison as it stands after. Refused (409) when the normberäkning is not
   * saved in Lifecare or a picked income cannot be transferred.
   */
  async transfer(errandIdentifier: string, request: SsbtekTransferDto): Promise<SsbtekChangesView> {
    const errandId = await this.errandIdOf(errandIdentifier);
    const changes = await this.readRawChanges(errandId);
    if (!changes) {
      throw new HttpException(CONFLICT, 'Normberäkningen behöver vara sparad i Lifecare innan inkomster kan överföras från SSBTEK.');
    }
    const { rows, applied } = incomeTransferFor(request.incomes, toSsbtekChangesView(changes));
    // One at a time: each write changes the same beräkning.
    for (const row of rows) {
      await this.normberakning.addRow(errandId, 'incomes', row);
    }
    await this.reportApplied(errandId, changes.calculationId, applied);
    return this.readChanges(errandId);
  }

  /** careM's comparison, or undefined when it has none to make (careM answers 404: no normberäkning in Lifecare). */
  private async readRawChanges(errandId: string): Promise<SsbtekChanges | undefined> {
    try {
      return await this.changesService.readChanges(errandId);
    } catch (error) {
      if (httpStatusOf(error) === NOT_FOUND) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Tells careM what was written. Best-effort: the incomes are in the normberäkning either way, and careM's
   * comparison no longer offers an income the normberäkning has.
   */
  private async reportApplied(errandId: string, calculationId: number | undefined, applied: AppliedSsbtekChange[]): Promise<void> {
    if (calculationId === undefined) {
      return;
    }
    try {
      await this.changesService.reportApplied(errandId, { calculationId, applied });
    } catch {
      logger.warn(`Transferred SSBTEK incomes on errand ${errandId} but could not tell careM`);
    }
  }

  private async errandIdOf(errandIdentifier: string): Promise<string> {
    const errand = await this.errandService.getErrandByIdentifier(errandIdentifier);
    return errand.data.id ?? errandIdentifier;
  }
}

export default ErrandSsbtekTransferService;
