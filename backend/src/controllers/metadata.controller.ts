import { HttpException } from '@exceptions/HttpException';
import authMiddleware from '@middlewares/auth.middleware';
import CaremanagementMetadataService from '@services/caremanagement-metadata.service';
import { Controller, Get, QueryParam, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { ReadLookupsParamsKindEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LookupsApiResponse } from '@/responses/lookup.response';

@Controller()
export class MetadataController {
  private metadataService = new CaremanagementMetadataService();

  @Get('/metadata')
  @OpenAPI({ summary: 'Read metadata lookups of a given kind (CATEGORY, STATUS, TYPE, ROLE, CONTACT_REASON)' })
  @ResponseSchema(LookupsApiResponse)
  @UseBefore(authMiddleware)
  // `kind` is typed as a plain string (not the enum) so routing-controllers treats it as a primitive query
  // param instead of trying to JSON-parse the value (which fails for e.g. "STATUS"); the enum is validated
  // manually below.
  async readLookups(@QueryParam('kind', { required: true }) kind: string) {
    if (!(Object.values(ReadLookupsParamsKindEnum) as string[]).includes(kind)) {
      throw new HttpException(400, 'Invalid lookup kind');
    }
    const res = await this.metadataService.readLookups(kind as ReadLookupsParamsKindEnum);
    return { data: res.data, message: 'success' };
  }
}
