import { gatewayAuthorization } from '@services/api-token.service';
import { caremanagementError } from '@utils/caremanagement-error';
import { templatingUrl } from '@utils/templating-url';
import axios from 'axios';

/** A metadata tag on a template (e.g. { key: 'code', value: 'LETTER' }). */
interface TemplateMetadata {
  key?: string;
  value?: string;
}

/** A template as returned by the list/search endpoints — content excluded. */
export interface TemplateSummary {
  identifier?: string;
  version?: string;
  name?: string;
  description?: string;
  metadata?: TemplateMetadata[];
}

/** A single template including its BASE64-encoded content. */
interface DetailedTemplate extends TemplateSummary {
  content?: string;
}

/** What is sent when storing a template. Content is BASE64-encoded; metadata carries the app/code/kind tags. */
interface TemplateInput {
  identifier: string;
  name: string;
  description?: string;
  /** Decoded HTML — the service encodes it before sending. */
  content: string;
  metadata: TemplateMetadata[];
}

/**
 * Reads and writes document/phrase templates in the Sundsvall Templating service. Templating is reached
 * directly (no gateway, no auth); templates are tagged with metadata (app/code/kind) that the controllers
 * filter on.
 */
class TemplatingService {
  /** All templates for the municipality (content excluded). */
  async listTemplates(): Promise<TemplateSummary[]> {
    try {
      const res = await axios.get<TemplateSummary[]>(templatingUrl('templates'), { headers: await gatewayAuthorization() });
      return res.data ?? [];
    } catch (error) {
      throw caremanagementError(error);
    }
  }

  /** The latest version of a template by identifier, including its BASE64 content. */
  async getTemplate(identifier: string): Promise<DetailedTemplate> {
    try {
      const res = await axios.get<DetailedTemplate>(templatingUrl('templates', identifier), { headers: await gatewayAuthorization() });
      return res.data;
    } catch (error) {
      throw caremanagementError(error);
    }
  }

  /**
   * Stores a template. The endpoint is an upsert keyed on the identifier: storing one that already exists
   * adds a new version rather than replacing it, which is what makes "spara" on an existing mall work.
   */
  async storeTemplate(input: TemplateInput): Promise<void> {
    try {
      await axios.post(
        templatingUrl('templates'),
        {
          identifier: input.identifier,
          name: input.name,
          description: input.description,
          content: Buffer.from(input.content, 'utf-8').toString('base64'),
          metadata: input.metadata,
          versionIncrement: 'MINOR',
        },
        { headers: await gatewayAuthorization() },
      );
    } catch (error) {
      throw caremanagementError(error);
    }
  }

  /** Deletes a template and every one of its versions. */
  async deleteTemplate(identifier: string): Promise<void> {
    try {
      await axios.delete(templatingUrl('templates', identifier), { headers: await gatewayAuthorization() });
    } catch (error) {
      throw caremanagementError(error);
    }
  }

  /** Renders provided HTML to a PDF (render/direct/pdf). Returns the PDF as a BASE64-encoded string. */
  async renderHtmlToPdf(html: string): Promise<string> {
    try {
      const res = await axios.post<{ output?: string }>(
        templatingUrl('render', 'direct', 'pdf'),
        {
          content: Buffer.from(html, 'utf-8').toString('base64'),
          parameters: {},
        },
        { headers: await gatewayAuthorization() },
      );
      return res.data.output ?? '';
    } catch (error) {
      throw caremanagementError(error);
    }
  }
}

export default TemplatingService;
