import { HttpException } from '@exceptions/HttpException';

import {
  CommunicationChannels,
  FinalizeDecisionOutcomeEnum,
  FinalizePayment,
  FinalizeRequest,
  Payment,
  PaymentStatusEnum,
} from '@/data-contracts/caremanagement/data-contracts';
import { LifecareDecisionView } from '@/responses/lifecare-decision.response';

// The month a payment concerns, as finalize wants it (yyyy-MM). A full date is cut to its month.
const CONCERNED_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])/;

/** The utbetalningar a handläggare saved on the errand and that nothing has handed to Lifecare yet. */
export const draftPayments = (payments: Payment[]): Payment[] => payments.filter(payment => payment.status === PaymentStatusEnum.DRAFT);

const toOutcome = (value?: string): FinalizeDecisionOutcomeEnum | undefined =>
  Object.values(FinalizeDecisionOutcomeEnum).find(outcome => outcome === value);

const carriesAmount = (outcome: FinalizeDecisionOutcomeEnum): boolean => outcome !== FinalizeDecisionOutcomeEnum.AVSLAG;

/** Maps a saved draft onto the payment finalize registers, refusing one that lacks what Lifecare needs. */
export const toFinalizePayment = (payment: Payment): FinalizePayment => {
  const concernedMonth = CONCERNED_MONTH_PATTERN.exec(payment.applicationMonth ?? '')?.[0];
  if (!payment.paymentDate || payment.amount === undefined || !concernedMonth || !payment.payeeName || !payment.paymentMethod) {
    throw new HttpException(400, 'En sparad utbetalning saknar datum, belopp, avser månad, mottagare eller betalsätt.');
  }
  return {
    paymentDate: payment.paymentDate,
    amount: payment.amount,
    concernedMonth,
    payee: {
      id: payment.payeeId,
      name: payment.payeeName,
      paymentMethod: payment.paymentMethod,
      clearing: payment.clearingNumber,
      accountNumber: payment.accountNumber,
    },
    accountingCode: payment.accountingCode,
  };
};

interface FinalizeRequestParts {
  /** The errand's beslut as it stands in Lifecare. */
  beslut: LifecareDecisionView | undefined;
  drafts: Payment[];
  communication: CommunicationChannels;
  householdSizeChanged: boolean;
}

/**
 * Builds the finalize payload from what the handläggare has saved: the beslut as it stands in Lifecare
 * (outcome, period, amount, orsak and beslutsmeddelande) and the utbetalning drafts. The checks here are
 * the ones caremanagement would otherwise answer with a bare 400, phrased so the handläggare knows what to do.
 */
export const buildFinalizeRequest = ({ beslut, drafts, communication, householdSizeChanged }: FinalizeRequestParts): FinalizeRequest => {
  if (!beslut) {
    throw new HttpException(400, 'Spara beslutet innan du beslutar och betalar ut.');
  }
  const outcome = toOutcome(beslut.outcome);
  if (!outcome) {
    throw new HttpException(400, 'Beslutet i Lifecare har en beslutstyp som inte går att verkställa från Drakel.');
  }
  const grants = carriesAmount(outcome);
  if (grants && drafts.length === 0) {
    throw new HttpException(400, 'Registrera minst en utbetalning innan du beslutar och betalar ut.');
  }

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
    // An avslag pays nothing, so caremanagement requires the list empty whatever drafts were saved.
    payments: grants ? drafts.map(toFinalizePayment) : [],
    householdSizeChanged,
  };
};
