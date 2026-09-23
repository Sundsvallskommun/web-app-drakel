import { FinalizeResult } from '@data-contracts/backend/data-contracts';

/** A part of "Besluta och utbetala" that did not go through once the errand was already decided. */
export interface FinalizeFollowUp {
  /** The translation key under `decideAndPay.done`. */
  key: 'failedChannels' | 'payeeWarnings' | 'failedRpaTasks' | 'processNotResumed';
  detail?: string;
}

/**
 * What the handläggare still has to see to after a finalize: the channels the beslut could not reach, the
 * payees caremanagement warned about, the Lifecare write-backs it could not queue, and a process that was
 * never told about the decision. Empty when everything went through.
 */
export const finalizeFollowUps = (result: FinalizeResult): FinalizeFollowUp[] => {
  const followUps: FinalizeFollowUp[] = [];
  if (result.failedChannels.length > 0) {
    followUps.push({ key: 'failedChannels', detail: result.failedChannels.join(', ') });
  }
  result.payeeWarnings.forEach((warning) => {
    followUps.push({ key: 'payeeWarnings', detail: warning });
  });
  if (result.failedRpaTasks.length > 0) {
    followUps.push({ key: 'failedRpaTasks', detail: result.failedRpaTasks.join(', ') });
  }
  if (!result.processMessageCorrelated) {
    followUps.push({ key: 'processNotResumed' });
  }
  return followUps;
};
