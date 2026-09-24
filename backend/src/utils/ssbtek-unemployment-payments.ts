import { SsbtekPayment } from '@/responses/ssbtek.response';

import { asList, fieldAt, numberOf, textOf } from './ssbtek-json';

const BENEFIT = 'Arbetslöshetsersättning';

const toPayment = (payment: unknown): SsbtekPayment => ({
  source: 'AKASSA',
  benefit: BENEFIT,
  paidOn: textOf(fieldAt(payment, 'Utbetalningsdatum')),
  netAmount: numberOf(fieldAt(payment, 'NettoEfterAvdrag')) ?? numberOf(fieldAt(payment, 'NettoEfterSkatt')),
  periodFrom: textOf(fieldAt(payment, 'AvserFrom')),
  periodTo: textOf(fieldAt(payment, 'AvserTom')),
  preliminary: false,
  parts: [],
});

/** The a-kassornas payments of arbetslöshetsersättning, per answering a-kassa (Sveriges a-kassor, "so"). */
export const unemploymentPayments = (soAnswer: unknown): SsbtekPayment[] =>
  asList(fieldAt(soAnswer, 'ArbetsloshetsersattningLista', 'Arbetsloshetsersattning')).flatMap(fund =>
    asList(fieldAt(fund, 'Utbetalningar')).map(toPayment),
  );
