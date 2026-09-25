import { toSsbtekPaymentsView } from '@utils/ssbtek-payments';
import { describe, expect, it } from 'vitest';

const code = (kod: string, beskrivning: string) => ({ kod, beskrivning });
const sek = (summa: number) => ({ summa, valuta: 'SEK' });

const FK_ANSWER = {
  formansinformation: {
    generellPersoninformation: [{ personnummer: '000000000000', foddes: '1990-01-12' }],
    utbetalningsuppgift: [
      {
        typ: { id: 1, beskrivning: 'Månad' },
        formansfamilj: { id: 'BOB', beskrivning: 'Bostadsbidrag' },
        datum: '2026-09-25',
        period: { fran: '2026-09-01', till: '2026-09-30' },
        nettobelopp: sek(4500),
      },
      {
        typ: { id: 2, beskrivning: 'Daglig' },
        formansfamilj: { id: 'DAG', beskrivning: 'Dagersättning' },
        datum: '2018-12-21',
        period: { fran: '2018-11-01', till: '2018-11-30' },
        nettobelopp: sek(513),
      },
    ],
    preliminarautbetalningar: [
      {
        typ: { id: 4, beskrivning: 'preliminär' },
        formansfamilj: { id: 'DAG', beskrivning: 'Dagersättning' },
        datum: '2026-09-27',
        bruttobelopp: sek(3248),
        skattebelopp: sek(0),
        avdragsbelopp: sek(0),
        nettobelopp: sek(3248),
        utbetalningsdetalj: [
          {
            forman: { id: 'AMP', beskrivning: 'Arbetsmarknadspolitiskt program' },
            period: { fran: '2026-08-01', till: '2026-08-26' },
            beloppstyp: { id: 'EE', beskrivning: 'Etableringsersättning' },
            omfattning: { taljare: 50, namnare: 100 },
            dagar: 19,
            timmar: 0,
            bruttobelopp: sek(2831),
          },
          {
            forman: { id: 'AMP', beskrivning: 'Arbetsmarknadspolitiskt program' },
            period: { fran: '2026-08-27', till: '2026-08-31' },
            bruttobelopp: sek(417),
          },
        ],
      },
    ],
  },
  utbetalningar: [
    {
      utbetalningsdatum: '2026-08-18',
      utbetalningsperiod: { from: '2026-08-01', tom: '2026-08-31' },
      bruttobelopp: 16361,
      nettobelopp: 14109,
      avdrag: [
        { belopp: -2252, avdragstyp: code('PM:PS', 'Preliminär skatt') },
        { belopp: -100, avdragstyp: code('PM:UH', 'Underhållsavdrag') },
      ],
      utbetalningsrader: [
        {
          formansgrupp: code('PM:BTI', 'Bostads- och inkomststöd'),
          utbetalningsforman: code('PM:BTP', 'Bostadstillägg'),
          beloppstyp: code('PM:BTP', 'Bostadstillägg'),
          belopp: 852,
        },
        {
          formansgrupp: code('PM:EF', 'Efterlevandeförmåner'),
          utbetalningsforman: code('PM:EP', 'Efterlevandepension'),
          beloppstyp: code('PM:ANKEP', 'Änkepension'),
          belopp: 4135,
        },
        {
          formansgrupp: code('PM:EF', 'Efterlevandeförmåner'),
          utbetalningsforman: code('PM:EP', 'Efterlevandepension'),
          beloppstyp: code('PM:BPFRI', 'Skattefri barnpension'),
          belopp: 1685,
        },
      ],
    },
  ],
};

// An a-kassa answer converted from XML: a single payment comes as the object itself, amounts as strings.
const SO_ANSWER = {
  ArbetsloshetsersattningLista: {
    Arbetsloshetsersattning: {
      SvarandeOrganisation: 'Testkassan',
      Utbetalningar: {
        Utbetalningsdatum: '2026-07-23',
        NettoEfterSkatt: '1250.50',
        NettoEfterAvdrag: '1200.50',
        AvserFrom: '2026-07-03',
        AvserTom: '2026-07-16',
      },
    },
  },
};

const PERIOD = { from: '2026-07-01', to: '2026-09-30' };
const NO_CO_APPLICANT = { kind: 'NONE' } as const;

const view = () => toSsbtekPaymentsView({ basis: { ...PERIOD, agencies: { fk: FK_ANSWER, so: SO_ANSWER } } }, NO_CO_APPLICANT, []);

describe('toSsbtekPaymentsView', () => {
  it('lists the payments paid in the period, newest first, and echoes the period', () => {
    const result = view();

    expect(result.from).toBe('2026-07-01');
    expect(result.to).toBe('2026-09-30');
    expect(result.payments.map(payment => [payment.source, payment.benefit, payment.paidOn])).toEqual([
      ['FK', 'Dagersättning', '2026-09-27'],
      ['FK', 'Bostadsbidrag', '2026-09-25'],
      ['PM', 'Bostadstillägg, Efterlevandepension', '2026-08-18'],
      ['AKASSA', 'Arbetslöshetsersättning', '2026-07-23'],
    ]);
  });

  it('reads a made Försäkringskassan payment', () => {
    expect(view().payments[1]).toEqual({
      person: 'APPLICANT',
      source: 'FK',
      benefit: 'Bostadsbidrag',
      paidOn: '2026-09-25',
      type: 'Månad',
      netAmount: 4500,
      grossAmount: undefined,
      deductionAmount: undefined,
      taxAmount: undefined,
      periodFrom: '2026-09-01',
      periodTo: '2026-09-30',
      preliminary: false,
      parts: [],
    });
  });

  it("specifies an announced Försäkringskassan payment per delförmån, spanning the delförmåner's periods", () => {
    const payment = view().payments[0];

    expect(payment).toMatchObject({ preliminary: true, type: 'preliminär', grossAmount: 3248, taxAmount: 0, netAmount: 3248 });
    expect([payment?.periodFrom, payment?.periodTo]).toEqual(['2026-08-01', '2026-08-31']);
    expect(payment?.parts[0]).toEqual({
      benefit: 'Arbetsmarknadspolitiskt program',
      amountType: 'Etableringsersättning',
      periodFrom: '2026-08-01',
      periodTo: '2026-08-26',
      extent: '50 %',
      hours: 0,
      days: 19,
      netAmount: undefined,
      grossAmount: 2831,
      deductionAmount: undefined,
      taxAmount: undefined,
    });
  });

  it('splits a Pensionsmyndigheten payment into tax and other deductions, with a row per förmån', () => {
    const payment = view().payments[2];

    expect(payment).toMatchObject({ grossAmount: 16361, netAmount: 14109, taxAmount: 2252, deductionAmount: 100 });
    expect(payment?.parts.map(part => [part.benefit, part.amountType, part.grossAmount])).toEqual([
      ['Bostadstillägg', 'Bostadstillägg', 852],
      ['Efterlevandepension', 'Änkepension', 4135],
      ['Efterlevandepension', 'Skattefri barnpension', 1685],
    ]);
  });

  it("reads an a-kassa's single payment given as an object, with its amounts as text", () => {
    expect(view().payments[3]).toMatchObject({ netAmount: 1200.5, periodFrom: '2026-07-03', periodTo: '2026-07-16' });
  });

  it('never passes on anything identifying from the verbatim answers', () => {
    expect(JSON.stringify(view())).not.toContain('000000000000');
    expect(JSON.stringify(view())).not.toContain('Testkassan');
  });

  it('lists nothing when no agency answered', () => {
    expect(toSsbtekPaymentsView({ basis: PERIOD }, NO_CO_APPLICANT, [])).toEqual({
      ...PERIOD,
      payments: [],
      hasCoApplicant: false,
      coApplicantUnavailable: false,
      hasChildren: false,
      unavailableChildren: [],
    });
  });

  it('lists the medsökandes payments beside the sökandes, the sökandes first on the same day', () => {
    const coApplicantAnswer = {
      formansinformation: {
        utbetalningsuppgift: [
          {
            formansfamilj: { id: 'SJP', beskrivning: 'Sjukpenning' },
            datum: '2026-09-25',
            period: { fran: '2026-09-01', till: '2026-09-30' },
            nettobelopp: sek(8000),
          },
        ],
      },
    };

    const result = toSsbtekPaymentsView(
      { basis: { ...PERIOD, agencies: { fk: FK_ANSWER } } },
      { kind: 'READ', basis: { ...PERIOD, agencies: { fk: coApplicantAnswer } } },
      [],
    );

    expect(result.hasCoApplicant).toBe(true);
    expect(result.coApplicantUnavailable).toBe(false);
    expect(result.payments.map(payment => [payment.person, payment.benefit, payment.paidOn])).toEqual([
      ['APPLICANT', 'Dagersättning', '2026-09-27'],
      ['APPLICANT', 'Bostadsbidrag', '2026-09-25'],
      ['CO_APPLICANT', 'Sjukpenning', '2026-09-25'],
      ['APPLICANT', 'Bostadstillägg, Efterlevandepension', '2026-08-18'],
    ]);
  });

  it('lists only the sökandes payments when SSBTEK could not be read for the medsökande, and says so', () => {
    const result = toSsbtekPaymentsView({ basis: { ...PERIOD, agencies: { fk: FK_ANSWER } } }, { kind: 'UNAVAILABLE' }, []);

    expect(result.hasCoApplicant).toBe(true);
    expect(result.coApplicantUnavailable).toBe(true);
    expect(result.payments.every(payment => payment.person === 'APPLICANT')).toBe(true);
  });
  it("lists each child's payments with the child's name, after the adults' on the same day", () => {
    const childAnswer = {
      formansinformation: {
        utbetalningsuppgift: [
          {
            formansfamilj: { id: 'US', beskrivning: 'Underhållsstöd' },
            datum: '2026-09-25',
            period: { fran: '2026-09-01', till: '2026-09-30' },
            nettobelopp: sek(1673),
          },
        ],
      },
    };

    const result = toSsbtekPaymentsView({ basis: { ...PERIOD, agencies: { fk: FK_ANSWER } } }, NO_CO_APPLICANT, [
      { name: 'Alva Testsson', basis: { ...PERIOD, agencies: { fk: childAnswer } } },
      { name: 'Ebbe Testsson' },
    ]);

    expect(result.hasChildren).toBe(true);
    expect(result.unavailableChildren).toEqual(['Ebbe Testsson']);
    expect(result.payments.map(payment => [payment.person, payment.childName, payment.benefit, payment.paidOn])).toEqual([
      ['APPLICANT', undefined, 'Dagersättning', '2026-09-27'],
      ['APPLICANT', undefined, 'Bostadsbidrag', '2026-09-25'],
      ['CHILD', 'Alva Testsson', 'Underhållsstöd', '2026-09-25'],
      ['APPLICANT', undefined, 'Bostadstillägg, Efterlevandepension', '2026-08-18'],
    ]);
  });

  it('tags each payment with the personnummer of whom it was paid to', () => {
    const someoneElsesAnswer = {
      formansinformation: {
        utbetalningsuppgift: [{ formansfamilj: { beskrivning: 'Underhållsstöd' }, datum: '2026-09-25', nettobelopp: sek(1673) }],
      },
    };
    const basisOf = (fk: unknown) => ({ ...PERIOD, agencies: { fk } });

    const result = toSsbtekPaymentsView(
      { basis: basisOf(FK_ANSWER), personalNumber: '199001011234' },
      { kind: 'READ', basis: basisOf(someoneElsesAnswer), personalNumber: '199202022345' },
      [{ name: 'Alva Testsson', personalNumber: '201503033456', basis: basisOf(someoneElsesAnswer) }],
    );

    const personalNumbers = new Map(result.payments.map(payment => [`${payment.person}:${payment.benefit}`, payment.personalNumber]));
    expect(personalNumbers.get('APPLICANT:Bostadsbidrag')).toBe('199001011234');
    expect(personalNumbers.get('CO_APPLICANT:Underhållsstöd')).toBe('199202022345');
    expect(personalNumbers.get('CHILD:Underhållsstöd')).toBe('201503033456');
  });
});
