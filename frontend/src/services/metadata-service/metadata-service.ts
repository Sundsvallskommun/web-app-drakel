import { Lookup, LookupsApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';

/**
 * The statuses an errand can have, for the overview's status filter.
 *
 * These come from the namespace's errand types rather than the STATUS lookups: the lookup table is
 * empty, and the catalogue — code, Swedish display name and lifecycle order — lives on the type.
 */
export const getStatuses = (): Promise<ServiceResponse<Lookup[]>> =>
  unwrapData(apiService.get<LookupsApiResponse>('errand-statuses'));

/**
 * The errand types of the namespace, for the overview's type filter. The value is the type slug, which
 * is what an errand carries and what the list endpoint filters on.
 */
export const getErrandTypes = (): Promise<ServiceResponse<Lookup[]>> =>
  unwrapData(apiService.get<LookupsApiResponse>('errand-types'));
