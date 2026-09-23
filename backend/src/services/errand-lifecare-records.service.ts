import { LIFECARE_CLIENT_ID_OVERRIDE, NODE_ENV } from '@config';
import { HttpException } from '@exceptions/HttpException';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareDocumentsService from '@services/lifecare-documents.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareRecordContentView, LifecareRecordsView, LifecareRecordView, toLifecareRecords } from '@/responses/lifecare-documents.response';
import { LifecareNoteTypeView, NewJournalNote, toNoteTypes } from '@/responses/lifecare-journal-note.response';

/** The stakeholder role whose Lifecare record is shown. */
const APPLICANT_ROLE = 'APPLICANT';

interface RecordEdit {
  content: string;
  occurenceDate?: string;
  time?: string;
}

/**
 * The applicant's Lifecare journalanteckningar and documents, seen from an errand.
 *
 * Every call is keyed by errand: the errand resolves to the Lifecare keys (the applicant's personnummer
 * for the person-wide list, the insats for new notes), so no personnummer ever travels in drakel's own
 * URLs — and every read and write lands in that errand's access log in careM.
 */
class ErrandLifecareRecordsService {
  private documentsService = new LifecareDocumentsService();
  private stakeholderService = new CaremanagementStakeholderService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();

  async list(errandId: string): Promise<LifecareRecordsView> {
    const identityNumber = await this.resolveClientId(errandId);
    const res = await this.documentsService.listForClient(identityNumber);
    await this.accessLog.logRead(errandId, {
      target: 'JOURNAL_AND_DOCUMENTS',
      description: 'Läste journalanteckningar och dokument i Lifecare',
    });
    return toLifecareRecords(res.data);
  }

  async readJournalNote(errandId: string, id: string): Promise<LifecareRecordContentView> {
    const res = await this.documentsService.readJournalNote(id);
    await this.accessLog.logRead(errandId, { target: 'JOURNAL_NOTE', description: 'Läste en journalanteckning i Lifecare', lifecareId: id });
    return res.data;
  }

  async readDocument(errandId: string, id: string): Promise<LifecareRecordContentView> {
    const res = await this.documentsService.readDocument(id);
    await this.accessLog.logRead(errandId, { target: 'DOCUMENT', description: 'Läste ett dokument i Lifecare', lifecareId: id });
    return res.data;
  }

  async updateJournalNote(errandId: string, id: string, edit: RecordEdit): Promise<LifecareRecordContentView> {
    const res = await this.documentsService.updateJournalNote(id, edit);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.UPDATE, {
      target: 'JOURNAL_NOTE',
      description: 'Ändrade en journalanteckning i Lifecare',
      lifecareId: id,
    });
    return res.data;
  }

  async updateDocument(errandId: string, id: string, edit: RecordEdit): Promise<LifecareRecordContentView> {
    const res = await this.documentsService.updateDocument(id, edit);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.UPDATE, {
      target: 'DOCUMENT',
      description: 'Ändrade ett dokument i Lifecare',
      lifecareId: id,
    });
    return res.data;
  }

  /** The note types a new journalanteckning on the errand's insats can have. */
  async journalNoteTypes(errandId: string): Promise<LifecareNoteTypeView[]> {
    const serviceId = await this.serviceIds.resolve(errandId);
    return toNoteTypes(await this.documentsService.readNoteProposal(serviceId));
  }

  /** Writes a new journalanteckning on the errand's insats in Lifecare. Nothing is kept in careM. */
  async createJournalNote(errandId: string, input: NewJournalNote & { noteTypeCode: number }): Promise<LifecareRecordView> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const created = await this.documentsService.createJournalNote(serviceId, input);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'JOURNAL_NOTE',
      description: 'Skrev en journalanteckning i Lifecare',
      lifecareId: created.id,
    });
    return created;
  }

  /**
   * The identity number Lifecare knows the applicant by.
   *
   * In development a configured override wins, so the tab can be tested against a known Lifecare
   * test person whose reserve number the Citizen API cannot produce. Otherwise it is the applicant
   * stakeholder's personnummer, resolved from their partyId.
   */
  private async resolveClientId(errandId: string): Promise<string> {
    if (NODE_ENV === 'development' && LIFECARE_CLIENT_ID_OVERRIDE) {
      return LIFECARE_CLIENT_ID_OVERRIDE;
    }

    const stakeholders = await this.stakeholderService.readStakeholders(errandId);
    const applicant = (stakeholders.data ?? []).find(stakeholder => stakeholder.role === APPLICANT_ROLE);
    if (!applicant?.personalNumber) {
      throw new HttpException(404, "Could not resolve the applicant's identity number for this errand");
    }
    return applicant.personalNumber;
  }
}

export default ErrandLifecareRecordsService;
