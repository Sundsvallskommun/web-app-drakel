/**
 * MOCK: what an SSBTEK lookup could answer, to show the panel's layout. There is no connection to SSBTEK yet.
 * TODO(ssbtek): replace with the BFF's SSBTEK lookup when it is built.
 */
export interface SsbtekMockRow {
  source: string;
  type: string;
  period: string;
  amount: number;
  status: 'Utbetald' | 'Beslutad' | 'Ingen uppgift';
}

export const SSBTEK_MOCK_ROWS: SsbtekMockRow[] = [
  { source: 'Försäkringskassan', type: 'Bostadsbidrag', period: '2026-09', amount: 1850, status: 'Utbetald' },
  {
    source: 'Försäkringskassan',
    type: 'Barnbidrag/Flerbarnstillägg',
    period: '2026-09',
    amount: 1250,
    status: 'Utbetald',
  },
  { source: 'Arbetsförmedlingen', type: 'Aktivitetsstöd', period: '2026-09', amount: 5600, status: 'Beslutad' },
  { source: 'CSN', type: 'Studiemedel', period: '2026-09', amount: 0, status: 'Ingen uppgift' },
  { source: 'Skatteverket', type: 'Lön efter skatt (AGI)', period: '2026-08', amount: 12300, status: 'Utbetald' },
  { source: 'Pensionsmyndigheten', type: 'Pension', period: '2026-09', amount: 0, status: 'Ingen uppgift' },
  { source: 'A-kassa', type: 'A-kassa/Alfaersättning', period: '2026-09', amount: 0, status: 'Ingen uppgift' },
];
