import { SsbtekPayment, SsbtekPaymentPersonEnum } from '@data-contracts/backend/data-contracts';
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';

import { ssbtekPersonLabel } from './ssbtek-person-label';

const paymentOf = (person: SsbtekPaymentPersonEnum, childName?: string): SsbtekPayment => ({
  person,
  childName,
  source: 'FK',
  benefit: 'Underhållsstöd',
  preliminary: false,
  parts: [],
});

describe('ssbtekPersonLabel', () => {
  it('says whether the payment is the sökandes or the medsökandes', () => {
    expect(ssbtekPersonLabel(paymentOf(SsbtekPaymentPersonEnum.APPLICANT), i18next.t)).toBe('Sökande');
    expect(ssbtekPersonLabel(paymentOf(SsbtekPaymentPersonEnum.CO_APPLICANT), i18next.t)).toBe('Medsökande');
  });

  it("names the child a child's payment is", () => {
    expect(ssbtekPersonLabel(paymentOf(SsbtekPaymentPersonEnum.CHILD, 'Alva Testsson'), i18next.t)).toBe(
      'Alva Testsson (barn)'
    );
  });

  it('says "Barn" for a child the ansökan gives no name', () => {
    expect(ssbtekPersonLabel(paymentOf(SsbtekPaymentPersonEnum.CHILD), i18next.t)).toBe('Barn');
  });
});
