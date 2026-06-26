import { IsNotEmpty, IsString } from 'class-validator';

/** Arbitrary HTML to render to a PDF (e.g. a beslut or beräkning preview). */
export class RenderPdfDto {
  @IsString() @IsNotEmpty() html!: string;
}
