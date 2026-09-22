import authMiddleware from '@middlewares/auth.middleware';
import { requirePermission } from '@middlewares/permission.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import TemplatingService, { TemplateSummary } from '@services/templating.service';
import { buildTemplateIdentifier } from '@utils/template-identifier';
import { appTemplateMetadata, CODE_KEY, isAppTemplate, KIND_KEY, metadataValue } from '@utils/template-metadata';
import { Body, Controller, Delete, Get, OnUndefined, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { SaveTemplateDto } from '@/dtos/admin-template.dto';
import { AdminTemplate, AdminTemplateApiResponse, AdminTemplatesApiResponse } from '@/responses/admin-template.response';

// `satisfies` rather than a return type annotation: the value keeps its plain object-literal type, so the
// detail endpoint can spread it — spreading a value typed as the response class would drop its prototype.
const toAdminTemplate = (template: TemplateSummary) =>
  ({
    identifier: template.identifier ?? '',
    version: template.version,
    name: template.name ?? '',
    description: template.description,
    code: metadataValue(template, CODE_KEY) ?? '',
    kind: metadataValue(template, KIND_KEY) ?? '',
  }) satisfies AdminTemplate;

/**
 * Manages the mallar and frastexter the handläggare pick from when writing a journalanteckning or a
 * dokument. Templates live in the shared Templating service and are tagged with metadata — `app` scopes
 * them to this app, `code` ties them to a CM type and `kind` separates a full mall from a frastext.
 *
 * Only a superadmin gets here: a mall is shared by everyone in the municipality, so editing one is not
 * part of ordinary handläggning.
 */
@Controller()
@UseBefore(authMiddleware, requirePermission('canManageTemplates'))
export class AdminTemplateController {
  private templatingService = new TemplatingService();

  @Get('/admin/templates')
  @OpenAPI({ summary: 'List every mall and frastext belonging to this app' })
  @ResponseSchema(AdminTemplatesApiResponse)
  async listTemplates() {
    const all = await this.templatingService.listTemplates();
    return { data: all.filter(isAppTemplate).map(toAdminTemplate), message: 'success' };
  }

  @Get('/admin/templates/:identifier')
  @OpenAPI({ summary: 'Get a mall or frastext with its decoded HTML content' })
  @ResponseSchema(AdminTemplateApiResponse)
  async getTemplate(@Param('identifier') identifier: string) {
    const template = await this.templatingService.getTemplate(identifier);
    const content = template.content ? Buffer.from(template.content, 'base64').toString('utf-8') : '';
    return { data: { ...toAdminTemplate(template), content }, message: 'success' };
  }

  @Post('/admin/templates')
  @OpenAPI({ summary: 'Create a mall or frastext, or save a new version of an existing one' })
  @ResponseSchema(AdminTemplatesApiResponse)
  @UseBefore(validationMiddleware(SaveTemplateDto, 'body'))
  async saveTemplate(@Body() input: SaveTemplateDto) {
    // A template that has no identifier yet is a new one; an existing identifier is stored as a new
    // version of that template, which is what keeps a saved edit from turning into a duplicate entry.
    const identifier = input.identifier ?? buildTemplateIdentifier(input.code, input.kind, input.name);
    await this.templatingService.storeTemplate({
      identifier,
      name: input.name,
      description: input.description,
      content: input.content,
      metadata: appTemplateMetadata(input.code, input.kind),
    });
    const all = await this.templatingService.listTemplates();
    return { data: all.filter(isAppTemplate).map(toAdminTemplate), message: 'success' };
  }

  @Delete('/admin/templates/:identifier')
  @OpenAPI({ summary: 'Delete a mall or frastext, including all its versions' })
  @OnUndefined(204)
  async deleteTemplate(@Param('identifier') identifier: string) {
    await this.templatingService.deleteTemplate(identifier);
  }
}
