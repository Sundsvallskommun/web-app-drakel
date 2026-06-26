import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import TemplatingService from '@services/templating.service';
import { Body, Controller, Post, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import { RenderPdfDto } from '@/dtos/pdf.dto';
import { HttpException } from '@/exceptions/HttpException';

/** Renders arbitrary HTML to a PDF (via Templating) for in-app previews (beslut, beräkning). Nothing is saved. */
@Controller()
export class PdfController {
  private templatingService = new TemplatingService();

  @Post('/pdf/render')
  @OpenAPI({ summary: 'Render HTML to a PDF (base64) for preview' })
  @UseBefore(authMiddleware, validationMiddleware(RenderPdfDto, 'body'))
  async render(@Body() input: RenderPdfDto) {
    const pdfBase64 = await this.templatingService.renderHtmlToPdf(input.html);
    if (!pdfBase64) {
      throw new HttpException(502, 'Failed to render the PDF');
    }
    return { data: { pdfBase64 }, message: 'success' };
  }
}
