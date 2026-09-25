import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { LifecareRecord, LifecareRecordBody, LifecareRecordContent, LifecareRecords } from '@/data-contracts/caremanagement/data-contracts';

/** Which side of the split a Lifecare row lands on. */
export type LifecareRecordCategory = 'JOURNAL_NOTE' | 'DOCUMENT';

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

/** A record's body, shown in the list without opening the record. */
export class LifecareRecordBodyView {
  @IsString() id!: string;
  /** The body as HTML; left out when Lifecare would not hand it over. */
  @IsString() @IsOptional() content?: string;
}

export class LifecareRecordBodiesApiResponse implements ApiResponse<LifecareRecordBodyView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareRecordBodyView) data!: LifecareRecordBodyView[];
  @IsString() message!: string;
}

/**
 * A record as careM lists it (or answers a create with), in the UI's shape. careM's contract leaves every field
 * optional; one it leaves out is shown empty, and a record whose category is missing takes the group it came in.
 */
export const toRecordView = (record: LifecareRecord, category: LifecareRecordCategory): LifecareRecordView => ({
  id: record.id ?? '',
  category: record.category ?? category,
  title: record.title ?? '',
  dateTime: record.dateTime ?? '',
  type: record.type ?? '',
  ownerTypeText: record.ownerTypeText ?? '',
  // careM may send null for a field it has no value for; drakel leaves such a field out.
  responsibleCaseworker: record.responsibleCaseworker ?? undefined,
  modifiedBy: record.modifiedBy ?? '',
  locked: record.locked ?? false,
  protected: record.protected ?? false,
});

/**
 * careM's split of the applicant's record into journalanteckningar and documents, in the tab's shape. The list is
 * the person's whole record across every akt, in Lifecare's order; the UI sorts if it wants to.
 */
export const toRecordsView = (records: LifecareRecords): LifecareRecordsView => ({
  journalNotes: (records.journalNotes ?? []).map(record => toRecordView(record, 'JOURNAL_NOTE')),
  documents: (records.documents ?? []).map(record => toRecordView(record, 'DOCUMENT')),
});

/**
 * An opened record as careM answers it, in the UI's shape. A record careM does not say is editable is shown
 * read-only, so nothing is offered for editing that Lifecare may refuse.
 */
export const toRecordContentView = (record: LifecareRecordContent, category: LifecareRecordCategory): LifecareRecordContentView => ({
  id: record.id ?? '',
  category: record.category ?? category,
  title: record.title ?? '',
  content: record.content ?? '',
  occurenceDate: record.occurenceDate ?? '',
  time: record.time ?? '',
  editable: record.editable ?? false,
});

/** A record's body as careM answers it; the content stays left out when Lifecare would not hand it over. */
export const toRecordBodyView = (body: LifecareRecordBody): LifecareRecordBodyView => ({
  id: body.id ?? '',
  content: body.content ?? undefined,
});
