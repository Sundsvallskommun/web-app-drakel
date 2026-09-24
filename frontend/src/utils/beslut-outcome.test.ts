import { bifallPhraseFor, decisionTypeFor, hasChildren, toBeslutOutcome } from './beslut-outcome';

/** Lifecare's beslutstyper for the insats (GetProposalForService, capture 2026-09-24), trimmed. */
const TYPES = [
  {
    code: 152,
    name: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag',
    outcome: 'AVSLAG',
    requiresFromDate: true,
    requiresToDate: true,
  },
  {
    code: 153,
    name: 'Ek Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, bifall',
    outcome: 'BIFALL',
    requiresFromDate: true,
    requiresToDate: true,
  },
  {
    code: 154,
    name: 'EK Ekonomiskt bistånd 12 Kap 2 § SoL, bifall',
    outcome: 'BIFALL',
    requiresFromDate: true,
    requiresToDate: true,
  },
];

describe('toBeslutOutcome', () => {
  it("takes careM's outcome as it is, and nothing careM did not decide", () => {
    expect(toBeslutOutcome('BIFALL')).toBe('BIFALL');
    expect(toBeslutOutcome('DELAVSLAG')).toBe('DELAVSLAG');
    expect(toBeslutOutcome('AVSLAG')).toBe('AVSLAG');
    expect(toBeslutOutcome('OK')).toBeUndefined();
    expect(toBeslutOutcome(undefined)).toBeUndefined();
  });
});

describe('decisionTypeFor', () => {
  it('registers bifall and delvis bifall as 12 kap 1, 7 §§ bifall, and avslag as its avslag', () => {
    expect(decisionTypeFor(TYPES, 'BIFALL')?.code).toBe(153);
    expect(decisionTypeFor(TYPES, 'DELAVSLAG')?.code).toBe(153);
    expect(decisionTypeFor(TYPES, 'AVSLAG')?.code).toBe(152);
  });
});

describe('the bifall beslutsformulering', () => {
  const phrases = [
    { identifier: 'a', category: 'Bifall', name: 'Bifall månad' },
    { identifier: 'b', category: 'Bifall', name: 'Bifall månad MED BARN' },
  ];

  it('is "Bifall månad MED BARN" with a barn or umgängesbarn in the beräkning, else "Bifall månad"', () => {
    expect(bifallPhraseFor(phrases, hasChildren({ persons: [{ role: 'CHILD', included: true }] }))?.identifier).toBe(
      'b'
    );
    expect(
      bifallPhraseFor(phrases, hasChildren({ persons: [{ role: 'VISITATION_CHILD', included: true }] }))?.identifier
    ).toBe('b');
    expect(bifallPhraseFor(phrases, hasChildren({ persons: [{ role: 'CHILD', included: false }] }))?.identifier).toBe(
      'a'
    );
  });
});
