import {
  DecisionRegistrationOutcomeEnum,
  FinalizeResult,
  PaymentRegistrationOutcomeEnum,
} from '@data-contracts/backend/data-contracts';

/** A part of "Besluta och utbetala" that did not go through once the errand was already decided. */
export interface FinalizeFollowUp {
  /** The translation key under `decideAndPay.done`. */
  key:
    | 'failedChannels'
    | 'payeeWarnings'
    | 'processNotResumed'
    | 'decisionNotRegistered'
    | 'decisionReceiptLost'
    | 'paymentNotRegistered'
    | 'paymentReceiptLost';
  detail?: string;
}

/**
 * What the handläggare still has to see to after a finalize: the channels the beslut could not reach, the
 * payees caremanagement warned about, a process that was
 * never told about the decision, a beslut and each utbetalning that did not get registered in Lifecare —
 * or got registered without careM hearing of it. Empty when everything went through.
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
  result.lifecarePayments.forEach((registration) => {
    if (registration.outcome !== PaymentRegistrationOutcomeEnum.REGISTERED) {
      followUps.push({ key: 'paymentNotRegistered', detail: registration.detail });
    } else if (registration.detail) {
      followUps.push({ key: 'paymentReceiptLost', detail: registration.detail });
    }
  });
  return followUps;
};
