import { Controller, Get } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import { HttpException } from '@/exceptions/HttpException';
import ApiService from '@/services/api.service';
import { gatewayUrl } from '@/utils/gateway-url';
import { logger } from '@/utils/logger';

@Controller()
export class HealthController {
  private apiService = new ApiService();

  @Get('/health/up')
  @OpenAPI({ summary: 'Return health check' })
  async up(): Promise<{ status: string }> {
    const url = gatewayUrl('simulatorserver', 'simulations', 'response');
    const data = { status: 'OK' };
    try {
      const res = await this.apiService.post<{ status: string }>({ url, params: { status: '200 OK' }, data });
      return res.data;
    } catch (error: unknown) {
      logger.error('Error when doing health check:', error);
      throw new HttpException(502, 'Health check failed');
    }
  }
}
