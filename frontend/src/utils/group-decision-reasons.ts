import { LifecareDecisionReasonView } from '@data-contracts/backend/data-contracts';

/** The orsaker under one heading of Lifecare's catalogue. */
export interface DecisionReasonGroup {
  header: string;
  reasons: LifecareDecisionReasonView[];
}

/**
 * Lifecare's orsaker grouped under their headings, the way Lifecare's own list shows them — headings and
 * orsaker both in the order Lifecare gave them.
 */
export const groupDecisionReasons = (reasons: LifecareDecisionReasonView[]): DecisionReasonGroup[] =>
  reasons.reduce<DecisionReasonGroup[]>((groups, reason) => {
    const group = groups.find((candidate) => candidate.header === reason.header);
    if (group) {
      group.reasons.push(reason);
      return groups;
    }
    return [...groups, { header: reason.header, reasons: [reason] }];
  }, []);
