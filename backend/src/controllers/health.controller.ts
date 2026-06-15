import { Controller, Get } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import { getApiBase } from '@/config/api-config';
import { HttpException } from '@/exceptions/HttpException';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';

@Controller()
export class HealthController {
  private apiService = new ApiService();
  public apiBaseUrl = getApiBase('simulatorserver');

  @Get('/health/up')
  @OpenAPI({ summary: 'Return health check' })
  async up(): Promise<{ status: string }> {
    const url = `${this.apiBaseUrl}/simulations/response?status=200%20OK`;
    const data = { status: 'OK' };
    try {
      const res = await this.apiService.post<{ status: string }>({ url, data });
      return res.data;
    } catch (error: unknown) {
      logger.error('Error when doing health check:', error);
      throw new HttpException(502, 'Health check failed');
    }
  }
}
