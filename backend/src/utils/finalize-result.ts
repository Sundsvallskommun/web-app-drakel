import { FinalizeResponse, LifecareDecisionRegistrationOutcomeEnum } from '@/data-contracts/caremanagement/data-contracts';
import { DecisionRegistration } from '@/responses/decision-registration.response';
import { FinalizeResult } from '@/responses/finalize.response';

// careM's registration outcomes as the BFF names them; a new careM outcome fails the build until it is mapped.
const REGISTRATION_OUTCOMES: Record<LifecareDecisionRegistrationOutcomeEnum, DecisionRegistration['outcome']> = {
  [LifecareDecisionRegistrationOutcomeEnum.REGISTERED]: 'REGISTERED',
  [LifecareDecisionRegistrationOutcomeEnum.FAILED]: 'FAILED',
  [LifecareDecisionRegistrationOutcomeEnum.NOT_SENT]: 'NOT_SENT',
};

/**
 * How careM tied the decision it recorded to the errand's beslut in Lifecare — careM makes that receipt in the
 * finalize call itself. Undefined when careM reports no registration.
 */
const toDecisionRegistration = ({ decisionId, lifecareDecision }: FinalizeResponse): DecisionRegistration | undefined => {
  const registeredDecisionId = lifecareDecision?.decisionId ?? decisionId;
  if (!lifecareDecision?.outcome || !registeredDecisionId) {
    return undefined;
  }
  return {
    decisionId: registeredDecisionId,
    outcome: REGISTRATION_OUTCOMES[lifecareDecision.outcome],
    lifecareId: lifecareDecision.lifecareId,
    detail: lifecareDecision.detail,
  };
};

/** The BFF's finalize result: careM's answer plus the channels the beslut could not be sent through. */
export const toFinalizeResult = (finalized: FinalizeResponse, failedChannels: string[]): FinalizeResult => ({
  decisionId: finalized.decisionId,
  processMessageCorrelated: finalized.processMessageCorrelated ?? false,
  lifecareDecision: toDecisionRegistration(finalized),
  failedChannels,
});
