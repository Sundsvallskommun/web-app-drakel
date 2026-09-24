import { DecisionRegistrationOutcomeEnum, FinalizeResult } from '@data-contracts/backend/data-contracts';

/** A part of "Besluta och utbetala" that did not go through once the errand was already decided. */
export interface FinalizeFollowUp {
  /** The translation key under `decideAndPay.done`. */
  key: 'failedChannels' | 'payeeWarnings' | 'processNotResumed' | 'decisionNotRegistered' | 'decisionReceiptLost';
  detail?: string;
}

/**
 * What the handläggare still has to see to after a finalize: the channels the beslut could not reach, the
 * payees caremanagement warned about, a process that was never told about the decision, and a beslut that
 * did not get linked in careM. Empty when everything went through.
 */
export const finalizeFollowUps = (result: FinalizeResult): FinalizeFollowUp[] => {
  const followUps: FinalizeFollowUp[] = [];
  if (result.failedChannels.length > 0) {
    followUps.push({ key: 'failedChannels', detail: result.failedChannels.join(', ') });
  }
  result.payeeWarnings.forEach((warning) => {
    followUps.push({ key: 'payeeWarnings', detail: warning });
  });
  if (!result.processMessageCorrelated) {
    followUps.push({ key: 'processNotResumed' });
  }
  const decision = result.lifecareDecision;
  if (decision && decision.outcome !== DecisionRegistrationOutcomeEnum.REGISTERED) {
    followUps.push({ key: 'decisionNotRegistered', detail: decision.detail });
  } else if (decision?.detail) {
    followUps.push({ key: 'decisionReceiptLost', detail: decision.detail });
  }
  return followUps;
};
