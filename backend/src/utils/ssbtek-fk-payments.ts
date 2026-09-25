import { SsbtekAgencyPayment, SsbtekPaymentPart } from '@/responses/ssbtek.response';

import { amountOf, asList, descriptionOf, extentOf, fieldAt, numberOf, periodOf, SsbtekPeriod, textOf } from './ssbtek-json';

const FALLBACK_BENEFIT = 'Försäkringskassan';

/** One row of a payment's utbetalningsdetalj — a delförmån. */
const toPart = (detail: unknown): SsbtekPaymentPart => {
  const period = periodOf(fieldAt(detail, 'period'));
  return {
    benefit: descriptionOf(fieldAt(detail, 'forman')),
    amountType: descriptionOf(fieldAt(detail, 'beloppstyp')),
    periodFrom: period.from,
    periodTo: period.to,
    extent: extentOf(fieldAt(detail, 'omfattning')),
    hours: numberOf(fieldAt(detail, 'timmar')),
    days: numberOf(fieldAt(detail, 'dagar')),
    netAmount: amountOf(fieldAt(detail, 'nettobelopp')),
    grossAmount: amountOf(fieldAt(detail, 'bruttobelopp')),
    deductionAmount: amountOf(fieldAt(detail, 'avdragsbelopp')),
    taxAmount: amountOf(fieldAt(detail, 'skattebelopp')),
  };
};

/** The span of the delförmåner's periods, for a payment that gives no period of its own. */
const spanOf = (parts: SsbtekPaymentPart[]): SsbtekPeriod => {
  const froms = parts.flatMap(part => (part.periodFrom ? [part.periodFrom] : [])).sort();
  const tos = parts.flatMap(part => (part.periodTo ? [part.periodTo] : [])).sort();
  return { from: froms[0], to: tos[tos.length - 1] };
};

const toPayment = (item: unknown, preliminary: boolean): SsbtekAgencyPayment => {
  const parts = asList(fieldAt(item, 'utbetalningsdetalj')).map(toPart);
  const ownPeriod = periodOf(fieldAt(item, 'period'));
  const hasOwnPeriod = ownPeriod.from !== undefined || ownPeriod.to !== undefined;
  const period = hasOwnPeriod ? ownPeriod : spanOf(parts);
  return {
    source: 'FK',
    benefit: descriptionOf(fieldAt(item, 'formansfamilj')) ?? FALLBACK_BENEFIT,
    paidOn: textOf(fieldAt(item, 'datum')),
    type: descriptionOf(fieldAt(item, 'typ')),
    netAmount: amountOf(fieldAt(item, 'nettobelopp')),
    grossAmount: amountOf(fieldAt(item, 'bruttobelopp')),
    deductionAmount: amountOf(fieldAt(item, 'avdragsbelopp')),
    taxAmount: amountOf(fieldAt(item, 'skattebelopp')),
    periodFrom: period.from,
    periodTo: period.to,
    preliminary,
    parts,
  };
};

/**
 * Försäkringskassan's payments, from its förmånsinformation: the made payments (utbetalningsuppgift) and the
 * announced ones (preliminarautbetalningar), each with its delförmåner (utbetalningsdetalj).
 */
export const forsakringskassanPayments = (fkAnswer: unknown): SsbtekAgencyPayment[] => {
  const benefits = fieldAt(fkAnswer, 'formansinformation');
  return [
    ...asList(fieldAt(benefits, 'utbetalningsuppgift')).map(item => toPayment(item, false)),
    ...asList(fieldAt(benefits, 'preliminarautbetalningar')).map(item => toPayment(item, true)),
  ];
};
