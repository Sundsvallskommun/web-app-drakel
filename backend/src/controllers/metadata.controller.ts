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

  @Get('/errand-statuses')
  @OpenAPI({ summary: "The statuses an errand can have, from the namespace's errand types (lifecycle order)" })
  @ResponseSchema(LookupsApiResponse)
  @UseBefore(authMiddleware)
  async readErrandStatuses() {
    // Every errand type in the namespace shares the same lifecycle today, but they are merged rather
    // than read off the first type so a type with an extra status still contributes it. First-seen
    // order is kept: the catalogue is ordered by lifecycle, not alphabetically.
    const res = await this.metadataService.readErrandTypes();
    const byCode = new Map<string, { name: string; displayName: string }>();
    (res.data ?? []).forEach(type => {
      (type.statuses ?? []).forEach(status => {
        if (status.code && !byCode.has(status.code)) {
          byCode.set(status.code, { name: status.code, displayName: status.displayName ?? status.code });
        }
      });
    });
    return { data: [...byCode.values()], message: 'success' };
  }

  @Get('/errand-types')
  @OpenAPI({ summary: "The namespace's errand types, for the overview's type filter" })
  @ResponseSchema(LookupsApiResponse)
  @UseBefore(authMiddleware)
  async readErrandTypes() {
    // The slug is what an errand carries and what the list endpoint filters on, so it is the value; the
    // display name is what the handläggare picks from.
    const res = await this.metadataService.readErrandTypes();
    return {
      data: (res.data ?? []).filter(type => !!type.typeSlug).map(type => ({ name: type.typeSlug, displayName: type.displayName ?? type.typeSlug })),
      message: 'success',
    };
  }
}
