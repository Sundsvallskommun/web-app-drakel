import { HttpException } from '@exceptions/HttpException';

import {
  CommunicationChannels,
  Decision,
  FinalizeDecisionOutcomeEnum,
  FinalizePayment,
  FinalizeRequest,
  Payment,
  PaymentStatusEnum,
} from '@/data-contracts/caremanagement/data-contracts';

// The month a payment concerns, as finalize wants it (yyyy-MM). A full date is cut to its month.
const CONCERNED_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])/;

/**
 * The handläggare's latest saved beslut — the newest decision that carries a beslutsmeddelande. Matching on
 * the message rather than just "newest" skips message-less decisions the errand may also hold.
 */
export const latestSavedBeslut = (decisions: Decision[]): Decision | undefined =>
  [...decisions].reverse().find(decision => (decision.decisionMessage ?? '').trim().length > 0);

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
  beslut: Decision | undefined;
  drafts: Payment[];
  reason: string | undefined;
  communication: CommunicationChannels;
  householdSizeChanged: boolean;
}

/**
 * Builds the finalize payload from what the handläggare has saved on the errand: the latest beslut
 * (outcome, period, amount and beslutsmeddelande) and the utbetalning drafts. The checks here are the
 * ones caremanagement would otherwise answer with a bare 400, phrased so the handläggare knows what to do.
 */
export const buildFinalizeRequest = ({ beslut, drafts, reason, communication, householdSizeChanged }: FinalizeRequestParts): FinalizeRequest => {
  if (!beslut) {
    throw new HttpException(400, 'Spara beslutet innan du beslutar och betalar ut.');
  }
  const outcome = toOutcome(beslut.value);
  if (!outcome) {
    throw new HttpException(400, `Beslutet "${beslut.value ?? ''}" går inte att verkställa.`);
  }
  const grants = carriesAmount(outcome);
  if (grants && beslut.amount === undefined) {
    throw new HttpException(400, 'Beslutet saknar belopp.');
  }
  if (grants && drafts.length === 0) {
    throw new HttpException(400, 'Registrera minst en utbetalning innan du beslutar och betalar ut.');
  }

  return {
    decision: {
      outcome,
      reason,
      periodFrom: beslut.periodFrom,
      periodTo: beslut.periodTo,
      amount: grants ? beslut.amount : 0,
      decisionMessage: beslut.decisionMessage,
    },
    communication,
    // An avslag pays nothing, so caremanagement requires the list empty whatever drafts were saved.
    payments: grants ? drafts.map(toFinalizePayment) : [],
    householdSizeChanged,
  };
};
