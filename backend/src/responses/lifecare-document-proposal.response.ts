import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';

import { LifecareDocumentType } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareEditableRecord } from '@/responses/lifecare-documents.response';

/**
 * One document type as Lifecare's `GetDocumentProposalForService` lists it — only the fields drakel
 * reads. Lifecare's own names: `documentCode` is the `documentTypeCode` a new document carries, `name`
 * its title. `isForm` marks a blankett, which is filled in field by field rather than written as text.
 * @public
 */
export interface LifecareDocumentTypeRaw {
  documentCode: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isForm: boolean;
  canChangeOccurenceDate: boolean;
  /** Whether a document of this type is write-protected unless the handläggare says otherwise. */
  writeProtectAuto?: boolean;
}

/**
 * Lifecare's proposal for a new document on an insats: the selectable document types, and a blank
 * document already bound to the insats that its own editor fills in and posts to `CreateDocument`.
 * @public
 */
export interface LifecareDocumentProposalRaw {
  documentTypes: LifecareDocumentTypeRaw[];
  document: LifecareEditableRecord;
}

/** A document type a handläggare can pick for a new document. */
export class LifecareDocumentTypeView {
  /** Lifecare's documentTypeCode. */
  @IsNumber() code!: number;
  @IsString() name!: string;
  /** Whether the documented date may differ from the one Lifecare proposes (today). */
  @IsBoolean() canChangeOccurenceDate!: boolean;
  /** Whether a new document of this type is saved skrivskyddad unless the handläggare says otherwise. */
  @IsBoolean() protectedByDefault!: boolean;
}

export class LifecareDocumentTypesApiResponse implements ApiResponse<LifecareDocumentTypeView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareDocumentTypeView) data!: LifecareDocumentTypeView[];
  @IsString() message!: string;
}

/**
 * The document types drakel can write: active, and not a blankett. A blankett is built from Lifecare's
 * form fields, which a free-text body cannot fill, so it stays in Lifecare's own editor.
 */
export const writableDocumentTypes = (proposal: LifecareDocumentProposalRaw): LifecareDocumentTypeRaw[] =>
  proposal.documentTypes.filter(documentType => documentType.isActive && !documentType.isForm);

/**
 * A document type as careM lists it (the writable ones, in Lifecare's order), in the form's shape. careM's contract
 * leaves every field optional; a type careM does not say allows another date keeps the proposed one, and one it does
 * not say is skrivskyddad by default is not.
 */
export const toDocumentTypeView = (documentType: LifecareDocumentType): LifecareDocumentTypeView => ({
  code: documentType.code ?? 0,
  name: documentType.name ?? '',
  canChangeOccurenceDate: documentType.canChangeOccurenceDate ?? false,
  protectedByDefault: documentType.protectedByDefault ?? false,
});

/** What a handläggare fills in on a new document. */
export interface NewDocument {
  content: string;
  title?: string;
  occurenceDate?: string;
  /** Saved skrivskyddad; the document type's own default when left out. */
  protected?: boolean;
}

/**
 * Fills Lifecare's blank document with what the handläggare wrote.
 *
 * The rest of the proposal is sent back as Lifecare returned it — its create endpoint takes its own full
 * object, and the blank document already carries the insats it belongs to. Without a rubrik of its own
 * the document is titled by its type. A type that fixes its date keeps the one Lifecare proposed.
 * `protected` is always sent, as for a journalanteckning.
 */
export const buildDocument = (
  proposal: LifecareDocumentProposalRaw,
  documentType: LifecareDocumentTypeRaw,
  input: NewDocument,
): LifecareEditableRecord => ({
  ...proposal.document,
  content: input.content,
  title: input.title?.trim() ? input.title.trim() : documentType.name,
  documentTypeCode: documentType.documentCode,
  protected: input.protected ?? documentType.writeProtectAuto === true,
  ...(input.occurenceDate && documentType.canChangeOccurenceDate ? { occurenceDate: input.occurenceDate } : {}),
});
