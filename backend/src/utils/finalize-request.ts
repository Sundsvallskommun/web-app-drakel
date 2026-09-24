import { HttpException } from '@exceptions/HttpException';

import { CommunicationChannels, FinalizeDecisionOutcomeEnum, FinalizeRequest } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareDecisionView } from '@/responses/lifecare-decision.response';

const toOutcome = (value?: string): FinalizeDecisionOutcomeEnum | undefined =>
  Object.values(FinalizeDecisionOutcomeEnum).find(outcome => outcome === value);

const carriesAmount = (outcome: FinalizeDecisionOutcomeEnum): boolean => outcome !== FinalizeDecisionOutcomeEnum.AVSLAG;

interface FinalizeRequestParts {
  /** The errand's beslut as it stands in Lifecare. */
  beslut: LifecareDecisionView | undefined;
  communication: CommunicationChannels;
  householdSizeChanged: boolean;
}

/**
 * Builds the finalize payload from the beslut as it stands in Lifecare (outcome, period, amount, orsak and
 * beslutsmeddelande). No utbetalningar go with it: the Utbetalning tab registers them in Lifecare directly,
 * and careM finds a bifall's utbetalning there itself. The checks here are the ones caremanagement would otherwise answer with a bare 400,
 * phrased so the handläggare knows what to do.
 */
export const buildFinalizeRequest = ({ beslut, communication, householdSizeChanged }: FinalizeRequestParts): FinalizeRequest => {
  if (!beslut) {
    throw new HttpException(400, 'Spara beslutet innan du beslutar och betalar ut.');
  }
  const outcome = toOutcome(beslut.outcome);
  if (!outcome) {
    throw new HttpException(400, 'Beslutet i Lifecare har en beslutstyp som inte går att verkställa från Drakel.');
  }
  const grants = carriesAmount(outcome);

  return {
    decision: {
      outcome,
      reason: beslut.reason,
      periodFrom: beslut.periodFrom,
      periodTo: beslut.periodTo,
      amount: grants ? beslut.amount : 0,
      decisionMessage: beslut.message,
    },
    communication,
    householdSizeChanged,
  };
};
