import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * One row of Lifecare's `GetDocumentsListForClient` answer — the fields drakel uses.
 *
 * Hand-written, since Lifecare's api2 has no OpenAPI to generate from. It is a subset: the endpoint
 * returns many more fields per row (workflow flags, PDF state, selection state) that drakel does not
 * read. `documentType_Name` is Lifecare's own key for what kind of record a row is — `JournalNote`
 * for a journalanteckning, and `Form`/`Regular`/`Pdf` for the various documents.
 * @public
 */
export interface LifecareDocumentModel {
  id: number;
  title: string;
  date: string;
  time: string;
  type: string;
  ownerTypeText: string;
  responsibleCaseworker: string | null;
  updateSignature: string;
  updateDate: string;
  protected: boolean;
  locked: boolean;
  documentType_Name: string;
}

/** The whole `GetDocumentsListForClient` payload — only the part drakel reads. @public */
export interface LifecareDocumentsListRaw {
  documentModels: LifecareDocumentModel[];
}

/** Which side of the split a Lifecare row lands on. */
export type LifecareRecordCategory = 'JOURNAL_NOTE' | 'DOCUMENT';

/** Lifecare's own name for a journalanteckning row; everything else is treated as a document. */
const JOURNAL_NOTE_TYPE = 'JournalNote';

/** A Lifecare record as drakel shows it — a journalanteckning or a document, cleaned up for the UI. */
export class LifecareRecordView {
  @IsString() id!: string;
  @IsString() category!: LifecareRecordCategory;
  @IsString() title!: string;
  /** Documented date and time as an ISO date-time (`date` and `time` joined). */
  @IsString() dateTime!: string;
  /** Lifecare's type label, e.g. "Journalanteckning", "Beslut", "Inkommen handling". */
  @IsString() type!: string;
  /** The akt/utredning the row sits under, e.g. "EK Ekonomiskt bistånd". */
  @IsString() ownerTypeText!: string;
  @IsString() @IsOptional() responsibleCaseworker?: string;
  /** Who last changed it and when, as Lifecare presents it. */
  @IsString() modifiedBy!: string;
  @IsBoolean() locked!: boolean;
  @IsBoolean() protected!: boolean;
}

/** The Lifecare records for a person, split into the two groups the tab shows. */
export class LifecareRecordsView {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareRecordView) journalNotes!: LifecareRecordView[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareRecordView) documents!: LifecareRecordView[];
}

export class LifecareRecordsApiResponse implements ApiResponse<LifecareRecordsView> {
  @ValidateNested() @Type(() => LifecareRecordsView) data!: LifecareRecordsView;
  @IsString() message!: string;
}

/**
 * A Lifecare record's editable object, as `GetJournalNoteWithContent` / `GetDocumentWithContent`
 * return it. Only the handful of fields drakel reads or writes are named; the rest is carried along
 * untouched when the object is posted back, so it is left as an opaque index. @public
 */
export interface LifecareEditableRecord {
  content?: string | null;
  occurenceDate?: string;
  occurenceTime?: string | null;
  time?: string | null;
  title?: string;
  documentId?: number;
  protected?: boolean;
  locked?: boolean;
  lockedSignature?: string;
  lockedDate?: string;
  [field: string]: unknown;
}

/**
 * Whether a Lifecare record may still be edited.
 *
 * A record is editable until it is finalised: Lifecare marks a finalised (upprättad) record
 * `protected`, and stamps a `lockedSignature`/`lockedDate` when it is locked. Either one closes it
 * to further changes, so both are treated as the gate.
 */
export const isEditable = (record: LifecareEditableRecord): boolean =>
  record.protected !== true && record.locked !== true && !record.lockedSignature && !record.lockedDate;

/** A Lifecare record with its body, as drakel shows it when a record is opened. */
export class LifecareRecordContentView {
  @IsString() id!: string;
  @IsString() category!: LifecareRecordCategory;
  @IsString() title!: string;
  /** The body as HTML. */
  @IsString() content!: string;
  /** Documented date, `YYYY-MM-DD`. */
  @IsString() occurenceDate!: string;
  /** Documented time, `HH:mm` (empty when the record has none). */
  @IsString() time!: string;
  /** Whether the record may still be edited in Lifecare. */
  @IsBoolean() editable!: boolean;
}

export class LifecareRecordApiResponse implements ApiResponse<LifecareRecordView> {
  @ValidateNested() @Type(() => LifecareRecordView) data!: LifecareRecordView;
  @IsString() message!: string;
}

export class LifecareRecordContentApiResponse implements ApiResponse<LifecareRecordContentView> {
  @ValidateNested() @Type(() => LifecareRecordContentView) data!: LifecareRecordContentView;
  @IsString() message!: string;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Builds the view shown when a record is opened, from Lifecare's editable object. */
export const toRecordContent = (record: LifecareEditableRecord, category: LifecareRecordCategory): LifecareRecordContentView => ({
  id: String(record.documentId ?? ''),
  category,
  title: asString(record.title),
  content: asString(record.content),
  occurenceDate: asString(record.occurenceDate),
  time: asString(record.time ?? record.occurenceTime),
  editable: isEditable(record),
});

/**
 * Applies a handläggare's edits onto Lifecare's editable object, ready to be posted back.
 *
 * Everything not named here is kept exactly as Lifecare returned it — the object is round-tripped,
 * not rebuilt, because Lifecare's update endpoints expect their own full object back.
 */
export const applyRecordEdit = (
  record: LifecareEditableRecord,
  edit: { content: string; occurenceDate?: string; time?: string },
): LifecareEditableRecord => ({
  ...record,
  content: edit.content,
  ...(edit.occurenceDate ? { occurenceDate: edit.occurenceDate } : {}),
  ...(edit.time ? { time: edit.time, occurenceTime: edit.time } : {}),
});

/** Turns one Lifecare document row — from the list, or the row a create answers with — into the UI's view. */
export const toLifecareRecord = (model: LifecareDocumentModel): LifecareRecordView => ({
  id: String(model.id),
  category: model.documentType_Name === JOURNAL_NOTE_TYPE ? 'JOURNAL_NOTE' : 'DOCUMENT',
  title: model.title,
  // Lifecare hands date and time apart; join them so the UI can format one value.
  dateTime: model.time ? `${model.date}T${model.time}` : model.date,
  type: model.type,
  ownerTypeText: model.ownerTypeText,
  responsibleCaseworker: model.responsibleCaseworker ?? undefined,
  modifiedBy: model.updateSignature ? `${model.updateSignature} ${model.updateDate}` : model.updateDate,
  locked: model.locked,
  protected: model.protected,
});

/**
 * Splits Lifecare's flat document list into journalanteckningar and documents.
 *
 * The list is one person's whole record across every akt, newest first as Lifecare returns it; the
 * order is kept rather than re-sorted here, and the UI sorts if it wants to.
 */
export const toLifecareRecords = (raw: LifecareDocumentsListRaw | undefined): LifecareRecordsView => {
  const models = raw?.documentModels ?? [];
  const records = models.map(toLifecareRecord);
  return {
    journalNotes: records.filter(record => record.category === 'JOURNAL_NOTE'),
    documents: records.filter(record => record.category === 'DOCUMENT'),
  };
};
