import { SsbtekPaymentPersonEnum, SsbtekPaymentsView } from '@data-contracts/backend/data-contracts';
import { getSsbtekPayments } from '@services/ssbtek-service';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SsbtekPayments } from './ssbtek-payments.component';

vi.mock('@services/ssbtek-service', () => ({ getSsbtekPayments: vi.fn() }));

/** A household of a sökande and one child, both paid in September. */
const HOUSEHOLD: SsbtekPaymentsView = {
  from: '2026-07-01',
  to: '2026-09-30',
  hasCoApplicant: false,
  coApplicantUnavailable: false,
  hasChildren: true,
  unavailableChildren: [],
  payments: [
    {
      person: SsbtekPaymentPersonEnum.APPLICANT,
      source: 'FK',
      benefit: 'Bostadsbidrag',
      paidOn: '2026-09-25',
      netAmount: 4500,
      preliminary: false,
      parts: [],
    },
    {
      person: SsbtekPaymentPersonEnum.CHILD,
      childName: 'Alva Testsson',
      source: 'FK',
      benefit: 'Underhållsstöd',
      paidOn: '2026-09-25',
      netAmount: 1673,
      preliminary: false,
      parts: [],
    },
  ],
};

describe('SsbtekPayments with the ansökan’s children', () => {
  beforeEach(() => {
    vi.mocked(getSsbtekPayments).mockReset();
  });

  it("shows a child's payment with the child's name in the Person column, even without a medsökande", async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({ data: HOUSEHOLD });

    render(<SsbtekPayments errandId="EB-26090036" />);

    expect(await screen.findByRole('columnheader', { name: 'Person' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /Underhållsstöd/ })).getByText('Alva Testsson (barn)')
    ).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /Bostadsbidrag/ })).getByText('Sökande')).toBeInTheDocument();
  });

  it('names the children SSBTEK could not be read for', async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({
      data: { ...HOUSEHOLD, unavailableChildren: ['Ebbe Testsson', ''] },
    });

    render(<SsbtekPayments errandId="EB-26090036" />);

    expect(
      await screen.findByText('SSBTEK kunde inte läsas för Ebbe Testsson, ett barn. Deras betalningar visas inte.')
    ).toBeInTheDocument();
  });
});
