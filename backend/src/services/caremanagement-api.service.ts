import { CAREMANAGEMENT_BASE_URL } from '@config';
import { ApiResponse } from '@interfaces/api-service.interface';
import { gatewayAuthorization } from '@services/api-token.service';
import { caremanagementError } from '@utils/caremanagement-error';
import { sentByHeaders } from '@utils/request-context';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * caremanagement responses also expose the Location header — set on 201 Created (empty body) — and the status,
 * which tells a 204 (nothing there, e.g. no beslut saved yet) from a 200.
 * @public
 */
export interface CaremanagementResponse<T> extends ApiResponse<T> {
  location?: string;
  status: number;
}

const NO_CONTENT = 204;

/**
 * The headers every caremanagement call carries: the gateway's bearer token, and the acting handläggare
 * (X-Sent-By) so caremanagement attributes its per-errand event log to a real user (adAccount). The handläggare
 * is absent when the request has no authenticated user (the actor is then logged null).
 */
export const caremanagementHeaders = async (): Promise<Record<string, string>> => ({
  // A caremanagement host called directly (CAREMANAGEMENT_BASE_URL, e.g. Dokploy) takes no gateway token.
  ...(CAREMANAGEMENT_BASE_URL ? {} : await gatewayAuthorization()),
  ...sentByHeaders(),
});

/**
 * Transport for the caremanagement API, reached through the WSO2 gateway like every other upstream. Callers pass
 * the absolute URL built by {@link caremanagementUrl}; it is used verbatim. Unlike {@link ApiService} it keeps
 * caremanagement's own refusals (status and reason) intact — see caremanagementError.
 */
class CaremanagementApiService {
  private async request<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    const preparedConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(await caremanagementHeaders()),
        ...(config.headers as Record<string, string> | undefined),
      },
    };

    try {
      const res = await axios<T>(preparedConfig);
      const headers = res.headers as Record<string, string | undefined>;
      return { data: res.data, message: 'success', location: headers.location, status: res.status };
    } catch (error) {
      throw caremanagementError(error);
    }
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
    const response = await this.get<ArrayBuffer>({ ...config, responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  public async get<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'GET' });
  }

  public async post<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'POST' });
  }

  public async put<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT' });
  }

  public async patch<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH' });
  }

  public async delete<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE' });
  }
}

export default CaremanagementApiService;
