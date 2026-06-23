import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

/** A Dokument (formal case document) on an errand. */
export class Document {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  errandId?: string;
  /** Document type (Lifecare 'Typ'/Dokumenttyp). */
  @IsString()
  @IsOptional()
  type?: string;
  @IsString()
  @IsOptional()
  heading?: string;
  @IsString()
  @IsOptional()
  text?: string;
  /** Documented date (yyyy-MM-dd). */
  @IsString()
  @IsOptional()
  documentDate?: string;
  /** Documented time (HH:mm). */
  @IsString()
  @IsOptional()
  documentTime?: string;
  /** WORKING = editable draft, LOCKED = upprättad handling. */
  @IsString()
  @IsOptional()
  status?: string;
  @IsString()
  @IsOptional()
  createdBy?: string;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modifiedBy?: string;
  @IsString()
  @IsOptional()
  modified?: string;
  @IsString()
  @IsOptional()
  lockedBy?: string;
  @IsString()
  @IsOptional()
  locked?: string;
}

/** A selectable document type (Lifecare 'Typ'/Dokumenttyp catalogue). */
export class DocumentType {
  @IsString()
  @IsOptional()
  code?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
}

export class DocumentsApiResponse implements ApiResponse<Document[]> {
  @ValidateNested({ each: true })
  @Type(() => Document)
  data!: Document[];
  @IsString()
  message!: string;
}

export class DocumentApiResponse implements ApiResponse<Document> {
  @ValidateNested()
  @Type(() => Document)
  data!: Document;
  @IsString()
  message!: string;
}

export class DocumentTypesApiResponse implements ApiResponse<DocumentType[]> {
  @ValidateNested({ each: true })
  @Type(() => DocumentType)
  data!: DocumentType[];
  @IsString()
  message!: string;
}
