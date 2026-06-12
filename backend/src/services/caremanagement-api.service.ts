import { HttpException } from '@/exceptions/HttpException';
import { ApiResponse } from '@interfaces/api-service.interface';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/** caremanagement responses also expose the Location header — set on 201 Created (empty body). */
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
      headers: { 'Content-Type': 'application/json', ...config.headers },
    };

    try {
      const res = await axios(preparedConfig);
      return { data: res.data, message: 'success', location: res.headers?.location };
    } catch (error: unknown | AxiosError) {
      if (axios.isAxiosError(error) && (error as AxiosError).response?.status === 404) {
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
