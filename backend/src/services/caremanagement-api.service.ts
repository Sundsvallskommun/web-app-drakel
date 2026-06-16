import { ApiResponse } from '@interfaces/api-service.interface';
import axios, { AxiosRequestConfig } from 'axios';

import { HttpException } from '@/exceptions/HttpException';

/**
 * caremanagement responses also expose the Location header — set on 201 Created (empty body).
 * @public
 */
export interface CaremanagementResponse<T> extends ApiResponse<T> {
  location?: string;
}

/**
 * Transport for the caremanagement API.
 *
 * Unlike {@link ApiService}, caremanagement is called directly on CAREMANAGEMENT_BASE_URL rather
 * than through the shared API gateway, and (in dev) requires no authorization. Callers pass the
 * absolute URL built by {@link caremanagementUrl}; it is used verbatim.
 */
class CaremanagementApiService {
  private async request<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    const preparedConfig: AxiosRequestConfig = {
      ...config,
      headers: { 'Content-Type': 'application/json', ...(config.headers as Record<string, string> | undefined) },
    };

    try {
      const res = await axios<T>(preparedConfig);
      const headers = res.headers as Record<string, string | undefined>;
      return { data: res.data, message: 'success', location: headers.location };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new HttpException(404, 'Not found');
      }
      throw new HttpException(500, 'Internal server error from caremanagement');
    }
  }

  public async get<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'GET' });
  }

  public async post<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'POST' });
  }

  public async patch<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH' });
  }

  public async delete<T>(config: AxiosRequestConfig): Promise<CaremanagementResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE' });
  }
}

export default CaremanagementApiService;
