import { LIFECARE_CLIENT_ID_OVERRIDE, NODE_ENV } from '@config';
import { HttpException } from '@exceptions/HttpException';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareDocumentsService from '@services/lifecare-documents.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { mapWithConcurrency } from '@utils/map-with-concurrency';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareDocumentTypeView, NewDocument, toDocumentTypes } from '@/responses/lifecare-document-proposal.response';
import {
  LifecareRecordBodyView,
  LifecareRecordCategory,
  LifecareRecordContentView,
  LifecareRecordEditInput,
  LifecareRecordsView,
  LifecareRecordView,
  textRecordIds,
  toLifecareRecords,
} from '@/responses/lifecare-documents.response';
import { LifecareNoteTypeView, NewJournalNote, toNoteTypes } from '@/responses/lifecare-journal-note.response';

/** The stakeholder role whose Lifecare record is shown. */
const APPLICANT_ROLE = 'APPLICANT';

/** Body reads in flight at once — quick enough for a tab, without flooding Lifecare. */
const BODY_READ_CONCURRENCY = 4;

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

  /**
   * The bodies of one group's records, so the tab can show every record's text without opening it.
   * Lifecare's list carries no bodies, so each is read on its own, a few at a time. A body Lifecare will
   * not hand over is left out rather than failing the rest. The reads land in the access log as one row.
   */
  async bodies(errandId: string, category: LifecareRecordCategory): Promise<LifecareRecordBodyView[]> {
    const identityNumber = await this.resolveClientId(errandId);
    const list = await this.documentsService.listForClient(identityNumber);
    const bodies = await mapWithConcurrency(
      textRecordIds(list.data, category),
      BODY_READ_CONCURRENCY,
      async (id): Promise<LifecareRecordBodyView> => {
        try {
          return { id, content: await this.documentsService.readBody(category, id) };
        } catch {
          return { id };
        }
      },
    );
    await this.accessLog.logRead(errandId, {
      target: 'JOURNAL_AND_DOCUMENTS',
      description: category === 'JOURNAL_NOTE' ? 'Läste journalanteckningarnas innehåll i Lifecare' : 'Läste dokumentens innehåll i Lifecare',
    });
    return bodies;
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

  async updateJournalNote(errandId: string, id: string, edit: LifecareRecordEditInput): Promise<LifecareRecordContentView> {
    const res = await this.documentsService.updateJournalNote(id, edit);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.UPDATE, {
      target: 'JOURNAL_NOTE',
      description: 'Ändrade en journalanteckning i Lifecare',
      lifecareId: id,
    });
    return res.data;
  }

  async updateDocument(errandId: string, id: string, edit: LifecareRecordEditInput): Promise<LifecareRecordContentView> {
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

  /** The document types a new document on the errand's insats can have. */
  async documentTypes(errandId: string): Promise<LifecareDocumentTypeView[]> {
    const serviceId = await this.serviceIds.resolve(errandId);
    return toDocumentTypes(await this.documentsService.readDocumentProposal(serviceId));
  }

  /** Writes a new document on the errand's insats in Lifecare. Nothing is kept in careM. */
  async createDocument(errandId: string, input: NewDocument & { documentTypeCode: number }): Promise<LifecareRecordView> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const created = await this.documentsService.createDocument(serviceId, input);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'DOCUMENT',
      description: 'Skrev ett dokument i Lifecare',
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
