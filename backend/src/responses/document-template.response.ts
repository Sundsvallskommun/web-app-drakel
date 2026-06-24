import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A selectable template (document or phrase) for the new-document editor. */
export class DocumentTemplateOption {
  /** The template identifier (used to fetch its content). */
  @IsString() @IsOptional() identifier?: string;
  /** The handläggare-facing template name. */
  @IsString() @IsOptional() name?: string;
}

/** The templates available for a document type, split into full documents and insertable phrases. */
export class DocumentTemplates {
  /** Full document templates (rubrikmallar) — selecting one replaces the editor content. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => DocumentTemplateOption) documents!: DocumentTemplateOption[];
  /** Phrase templates (frastexter) — selecting one is inserted at the cursor. */
  @IsArray() @ValidateNested({ each: true }) @Type(() => DocumentTemplateOption) phrases!: DocumentTemplateOption[];
}

/** A single template's decoded HTML content, ready for the rich-text editor. */
export class DocumentTemplateContent {
  @IsString() content!: string;
}

export class DocumentTemplatesApiResponse implements ApiResponse<DocumentTemplates> {
  @ValidateNested()
  @Type(() => DocumentTemplates)
  data!: DocumentTemplates;
  @IsString()
  message!: string;
}

export class DocumentTemplateContentApiResponse implements ApiResponse<DocumentTemplateContent> {
  @ValidateNested()
  @Type(() => DocumentTemplateContent)
  data!: DocumentTemplateContent;
  @IsString()
  message!: string;
}
