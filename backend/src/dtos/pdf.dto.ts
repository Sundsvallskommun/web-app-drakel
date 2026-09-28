import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * The most HTML a preview renders: far more than a beslut or a beräkning takes, while keeping one request from
 * handing Templating an arbitrarily large document.
 */
const MAX_PREVIEW_HTML_LENGTH = 2 * 1024 * 1024;

/** Arbitrary HTML to render to a PDF (e.g. a beslut or beräkning preview). */
export class RenderPdfDto {
  @IsString() @IsNotEmpty() @MaxLength(MAX_PREVIEW_HTML_LENGTH) html!: string;
}
