import { templatingUrl } from '@utils/templating-url';

import { UPSTREAM_FILE_TIMEOUT_MS } from '@/constants/upstream';
import {
  DetailedTemplateResponse,
  DirectRenderResponse,
  IncrementMode,
  Metadata,
  TemplateRequest,
  TemplateResponse,
} from '@/data-contracts/templating/data-contracts';

import TemplatingApiService from './templating-api.service';

/** What drakel reads of a template, whether from the list (content excluded) or read one by one. */
export type TemplateSummary = Pick<TemplateResponse, 'identifier' | 'version' | 'name' | 'description' | 'metadata'>;

/** A single template with its content decoded to the HTML it holds. */
type DecodedTemplate = TemplateSummary & { content: string };

/** What is stored as a template. Metadata carries the app/code/kind tags. */
interface TemplateInput {
  identifier: string;
  name: string;
  description?: string;
  /** Decoded HTML — the service encodes it before sending. */
  content: string;
  metadata: Metadata[];
}

/** Templating keeps a template's content, and answers a rendered PDF, BASE64-encoded. */
const toBase64 = (text: string): string => Buffer.from(text, 'utf-8').toString('base64');
const fromBase64 = (encoded: string): string => Buffer.from(encoded, 'base64').toString('utf-8');

/**
 * Reads and writes document/phrase templates in the Sundsvall Templating service — on its own host when
 * TEMPLATING_BASE_URL is set, otherwise through the WSO2 gateway. Templates are tagged with metadata
 * (app/code/kind) that the controllers filter on. Content is decoded and encoded here, so callers only see HTML.
 */
class TemplatingService {
  private apiService = new TemplatingApiService();

  /** All templates for the municipality (content excluded). */
  async listTemplates(): Promise<TemplateSummary[]> {
    const response = await this.apiService.get<TemplateSummary[]>({ url: templatingUrl('templates') });
    return response.data ?? [];
  }

  /** The latest version of a template by identifier, with its content decoded (empty when it has none). */
  async getTemplate(identifier: string): Promise<DecodedTemplate> {
    const response = await this.apiService.get<DetailedTemplateResponse>({ url: templatingUrl('templates', identifier) });
    const { content, ...summary } = response.data;
    return { ...summary, content: content ? fromBase64(content) : '' };
  }

  /**
   * Stores a template. The endpoint is an upsert keyed on the identifier: storing one that already exists
   * adds a new version rather than replacing it, which is what makes "spara" on an existing mall work.
   */
  async storeTemplate(input: TemplateInput): Promise<void> {
    const request: TemplateRequest = {
      identifier: input.identifier,
      name: input.name,
      description: input.description,
      content: toBase64(input.content),
      metadata: input.metadata,
      versionIncrement: IncrementMode.MINOR,
    };
    await this.apiService.post({ url: templatingUrl('templates'), data: request });
  }

  /** Deletes a template and every one of its versions. */
  async deleteTemplate(identifier: string): Promise<void> {
    await this.apiService.delete({ url: templatingUrl('templates', identifier) });
  }

  /** Renders provided HTML to a PDF (render/direct/pdf). Returns the PDF as a BASE64-encoded string. */
  async renderHtmlToPdf(html: string): Promise<string> {
    const response = await this.apiService.post<DirectRenderResponse>({
      url: templatingUrl('render', 'direct', 'pdf'),
      // Direct HTML has no variables: `parameters` goes as the empty object this call has always sent, although the
      // generated contract types it as a string.
      data: { content: toBase64(html), parameters: {} },
      timeout: UPSTREAM_FILE_TIMEOUT_MS,
    });
    return response.data.output ?? '';
  }
}

export default TemplatingService;
