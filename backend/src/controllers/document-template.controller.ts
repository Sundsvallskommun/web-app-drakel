import authMiddleware from '@middlewares/auth.middleware';
import TemplatingService, { TemplateSummary } from '@services/templating.service';
import { Controller, Get, Param, QueryParam, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import {
  DocumentTemplateContentApiResponse,
  DocumentTemplatesApiResponse,
} from '@/responses/document-template.response';

/** This app's templates live under the `app=drakel` metadata tag in the shared Templating service. */
const APP_TAG = 'drakel';

const metadataValue = (template: TemplateSummary, key: string): string | undefined =>
  template.metadata?.find((meta) => meta.key === key)?.value;

/**
 * Serves the document/phrase templates used by the new-document editor. Templates are stored in the
 * Templating service and tagged with metadata: `app` (scopes to this app), `code` (the CM document type,
 * e.g. LETTER) and `kind` (DOCUMENT = full rubrikmall, PHRASE = insertable frastext).
 */
@Controller()
export class DocumentTemplateController {
  private templatingService = new TemplatingService();

  @Get('/document-templates')
  @OpenAPI({ summary: 'List the document + phrase templates for a document type code' })
  @ResponseSchema(DocumentTemplatesApiResponse)
  @UseBefore(authMiddleware)
  async listTemplates(@QueryParam('code') code: string) {
    const all = await this.templatingService.listTemplates();
    const forType = all.filter(
      (template) => metadataValue(template, 'app') === APP_TAG && metadataValue(template, 'code') === code
    );
    const toOption = (template: TemplateSummary) => ({ identifier: template.identifier, name: template.name });
    return {
      data: {
        documents: forType.filter((template) => metadataValue(template, 'kind') === 'DOCUMENT').map(toOption),
        phrases: forType.filter((template) => metadataValue(template, 'kind') === 'PHRASE').map(toOption),
      },
      message: 'success',
    };
  }

  @Get('/document-templates/:identifier')
  @OpenAPI({ summary: 'Get a template’s decoded HTML content for the editor' })
  @ResponseSchema(DocumentTemplateContentApiResponse)
  @UseBefore(authMiddleware)
  async getTemplateContent(@Param('identifier') identifier: string) {
    const template = await this.templatingService.getTemplate(identifier);
    const content = template.content ? Buffer.from(template.content, 'base64').toString('utf-8') : '';
    return { data: { content }, message: 'success' };
  }
}
