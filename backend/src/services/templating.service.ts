import { caremanagementError } from '@utils/caremanagement-error';
import { templatingUrl } from '@utils/templating-url';
import axios from 'axios';

/** A metadata tag on a template (e.g. { key: 'code', value: 'LETTER' }). */
export interface TemplateMetadata {
  key?: string;
  value?: string;
}

/** A template as returned by the list/search endpoints — content excluded. */
export interface TemplateSummary {
  identifier?: string;
  name?: string;
  description?: string;
  metadata?: TemplateMetadata[];
}

/** A single template including its BASE64-encoded content. */
export interface DetailedTemplate extends TemplateSummary {
  content?: string;
}

/**
 * Reads document/phrase templates from the Sundsvall Templating service. Templating is reached directly
 * (no gateway, no auth); templates are tagged with metadata (app/code/kind) that the controller filters on.
 */
class TemplatingService {
  /** All templates for the municipality (content excluded). */
  async listTemplates(): Promise<TemplateSummary[]> {
    try {
      const res = await axios.get<TemplateSummary[]>(templatingUrl('templates'));
      return res.data ?? [];
    } catch (error) {
      throw caremanagementError(error);
    }
  }

  /** The latest version of a template by identifier, including its BASE64 content. */
  async getTemplate(identifier: string): Promise<DetailedTemplate> {
    try {
      const res = await axios.get<DetailedTemplate>(templatingUrl('templates', identifier));
      return res.data;
    } catch (error) {
      throw caremanagementError(error);
    }
  }

  /** Renders provided HTML to a PDF (render/direct/pdf). Returns the PDF as a BASE64-encoded string. */
  async renderHtmlToPdf(html: string): Promise<string> {
    try {
      const res = await axios.post<{ output?: string }>(templatingUrl('render', 'direct', 'pdf'), {
        content: Buffer.from(html, 'utf-8').toString('base64'),
        parameters: {},
      });
      return res.data.output ?? '';
    } catch (error) {
      throw caremanagementError(error);
    }
  }
}

export default TemplatingService;
