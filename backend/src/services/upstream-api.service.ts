import { ApiResponse } from '@interfaces/api-service.interface';
import axios, { AxiosRequestConfig } from 'axios';

import { MAX_UPSTREAM_REQUEST_BYTES, MAX_UPSTREAM_RESPONSE_BYTES, UPSTREAM_TIMEOUT_MS } from '@/constants/upstream';
import { HttpException } from '@/exceptions/HttpException';

/**
 * An upstream API's answer. Besides the data it carries the status — which tells a 204 (nothing there) from a 200 —
 * the Location header set on a 201 Created with an empty body, and the headers, for reading a file's content type and
 * name.
 */
interface UpstreamResponse<T> extends ApiResponse<T> {
  location?: string;
  status: number;
  headers?: Record<string, string | undefined>;
}

/**
 * The transport every upstream API is called through. Callers pass an absolute URL (see joinUrlSegments), used
 * verbatim. What differs between the upstreams — the headers they are called with and how their failures reach the
 * frontend — is left to the subclass; the rest (JSON by default, a timeout, size limits, the response's shape) is here
 * once.
 */
abstract class UpstreamApiService {
  /** The headers every call to this upstream carries, e.g. the gateway's bearer token. */
  protected abstract upstreamHeaders(): Promise<Record<string, string>>;

  /** The HttpException drakel answers with when a call to this upstream fails. */
  protected abstract toHttpException(error: unknown): HttpException;

  protected async request<T>(config: AxiosRequestConfig): Promise<UpstreamResponse<T>> {
    const preparedConfig: AxiosRequestConfig = {
      timeout: UPSTREAM_TIMEOUT_MS,
      maxContentLength: MAX_UPSTREAM_RESPONSE_BYTES,
      maxBodyLength: MAX_UPSTREAM_REQUEST_BYTES,
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(await this.upstreamHeaders()),
        ...(config.headers as Record<string, string> | undefined),
      },
    };

    try {
      const response = await axios<T>(preparedConfig);
      const headers = response.headers as Record<string, string | undefined>;
      return { data: response.data, message: 'success', location: headers.location, status: response.status, headers };
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  public async get<T>(config: AxiosRequestConfig): Promise<UpstreamResponse<T>> {
    return this.request<T>({ ...config, method: 'GET' });
  }

  public async post<T>(config: AxiosRequestConfig): Promise<UpstreamResponse<T>> {
    return this.request<T>({ ...config, method: 'POST' });
  }

  public async put<T>(config: AxiosRequestConfig): Promise<UpstreamResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT' });
  }

  public async patch<T>(config: AxiosRequestConfig): Promise<UpstreamResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH' });
  }

  public async delete<T>(config: AxiosRequestConfig): Promise<UpstreamResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE' });
  }
}

export default UpstreamApiService;
