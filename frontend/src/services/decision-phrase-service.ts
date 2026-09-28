import { DecisionPhrase, DecisionPhrasesApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';

/** The beslutsformuleringar (kategori and rubrik) the Beslut tab offers; their text is read when added. */
export const getDecisionPhrases = (): Promise<ServiceResponse<DecisionPhrase[]>> =>
  unwrapData(apiService.get<DecisionPhrasesApiResponse>('decision-phrases'));
