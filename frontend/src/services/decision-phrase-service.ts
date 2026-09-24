import { DecisionPhrase, DecisionPhrasesApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/** The beslutsformuleringar (kategori and rubrik) the Beslut tab offers; their text is read when added. */
export const getDecisionPhrases = (): Promise<ServiceResponse<DecisionPhrase[]>> =>
  apiService
    .get<DecisionPhrasesApiResponse>('decision-phrases')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
