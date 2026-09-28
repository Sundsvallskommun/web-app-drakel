import { CAREMANAGEMENT_BASE_URL } from '@config';
import { AttachmentFile } from '@interfaces/file.interface';
import { gatewayAuthorization } from '@services/api-token.service';
import { caremanagementError } from '@utils/caremanagement-error';
import { sentByHeaders } from '@utils/request-context';
import { AxiosRequestConfig } from 'axios';
import FormData from 'form-data';

import { UPSTREAM_FILE_TIMEOUT_MS } from '@/constants/upstream';
import { HttpException } from '@/exceptions/HttpException';
import { fileNameFromDisposition } from '@/utils/content-disposition';

import UpstreamApiService from './upstream-api.service';

const NO_CONTENT = 204;

/**
 * The headers every caremanagement call carries: the gateway's bearer token — unless caremanagement has a host of its
 * own — and the acting handläggare (X-Sent-By) so caremanagement attributes its per-errand event log to a real user
 * (adAccount). The handläggare is absent when the request has no authenticated user (the actor is then logged null).
 */
const caremanagementHeaders = async (): Promise<Record<string, string>> => ({
  // A caremanagement host called directly (CAREMANAGEMENT_BASE_URL, e.g. Dokploy) takes no gateway token.
  ...(CAREMANAGEMENT_BASE_URL ? {} : await gatewayAuthorization()),
  ...sentByHeaders(),
});

/** A multipart request: the form with its parts, and the query parameters that go beside it. */
interface MultipartRequest {
  url: string;
  form: FormData;
  params?: Record<string, string>;
}

/**
 * Transport for the caremanagement API — through the WSO2 gateway, or directly on CAREMANAGEMENT_BASE_URL when that
 * is set. Callers pass the absolute URL built by {@link caremanagementUrl}; it is used verbatim. Unlike
 * {@link ApiService} it keeps caremanagement's own refusals (status and reason) intact — see caremanagementError.
 */
class CaremanagementApiService extends UpstreamApiService {
  protected override upstreamHeaders(): Promise<Record<string, string>> {
    return caremanagementHeaders();
  }

  protected override toHttpException(error: unknown): HttpException {
    return caremanagementError(error);
  }

  /**
   * A read that caremanagement answers with 204 when there is nothing (e.g. no beslut saved yet): the data, or
   * null for the 204 — the `data: null` drakel's own responses use for "nothing yet".
   */
  public async getOrNull<T>(config: AxiosRequestConfig): Promise<T | null> {
    const response = await this.get<T>(config);
    return response.status === NO_CONTENT ? null : response.data;
  }

  /** A binary read, e.g. a PDF caremanagement answers raw (`application/pdf`), as a Buffer. */
  public async getBinary(config: AxiosRequestConfig): Promise<Buffer> {
    const response = await this.get<ArrayBuffer>({ ...config, responseType: 'arraybuffer', timeout: UPSTREAM_FILE_TIMEOUT_MS });
    return Buffer.from(response.data);
  }

  /** A file caremanagement answers raw (e.g. an attachment), with the content type and file name its headers give. */
  public async getFile(url: string): Promise<AttachmentFile> {
    const response = await this.get<ArrayBuffer>({ url, responseType: 'arraybuffer', timeout: UPSTREAM_FILE_TIMEOUT_MS });
    return {
      data: Buffer.from(response.data),
      contentType: response.headers?.['content-type'],
      fileName: fileNameFromDisposition(response.headers?.['content-disposition']),
    };
  }

  /**
   * Posts a multipart form, e.g. a file upload. The form's own Content-Type (with its boundary) replaces the JSON
   * default. caremanagement answers these with an empty 201/204, so nothing is returned.
   */
  public async postMultipart({ url, form, params }: MultipartRequest): Promise<void> {
    await this.post<unknown>({ url, data: form, params, headers: form.getHeaders(), timeout: UPSTREAM_FILE_TIMEOUT_MS });
  }
}

export default CaremanagementApiService;
