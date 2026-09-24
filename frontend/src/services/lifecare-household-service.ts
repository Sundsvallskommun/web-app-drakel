import {
  HouseholdCandidatesApiResponse,
  HouseholdCandidateView,
  LifecareHouseholdApiResponse,
  LifecareHouseholdView,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/**
 * The sökandes hushåll in Lifecare, for an errand whose normberäkning is saved there. Personnummer only travel in
 * request bodies, never in a URL.
 */
export const getLifecareHousehold = (errandId: string): Promise<ServiceResponse<LifecareHouseholdView>> =>
  apiService
    .get<LifecareHouseholdApiResponse>(`errands/${errandId}/lifecare-household`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Persons Lifecare finds for a name or personnummer, to add as a bonusbarn. */
export const findHouseholdCandidates = (
  errandId: string,
  filter: string
): Promise<ServiceResponse<HouseholdCandidateView[]>> =>
  apiService
    .post<HouseholdCandidatesApiResponse>(`errands/${errandId}/lifecare-household/candidates`, { filter })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Adds the person as a bonusbarn to the hushåll in Lifecare and takes them into the normberäkning. */
export const addBonusChild = (errandId: string, personId: string): Promise<ServiceResponse<null>> =>
  apiService
    .post(`errands/${errandId}/lifecare-household/bonus-children`, { personId })
    .then(() => ({ data: null }))
    .catch(toServiceError);

/** Takes a member or bonusbarn of the hushåll into the normberäkning in Lifecare. */
export const includeHouseholdPerson = (errandId: string, personId: string): Promise<ServiceResponse<null>> =>
  apiService
    .post(`errands/${errandId}/lifecare-household/calculation-persons`, { personId })
    .then(() => ({ data: null }))
    .catch(toServiceError);
