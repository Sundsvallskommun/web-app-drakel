import { SsbtekPaymentPersonEnum, SsbtekPaymentsView } from '@data-contracts/backend/data-contracts';
import { getSsbtekPayments } from '@services/ssbtek-service';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SsbtekPayments } from './ssbtek-payments.component';

vi.mock('@services/ssbtek-service', () => ({ getSsbtekPayments: vi.fn() }));

const { APPLICANT, CO_APPLICANT } = SsbtekPaymentPersonEnum;

const VIEW: SsbtekPaymentsView = {
  from: '2026-07-01',
  to: '2026-09-30',
  hasCoApplicant: false,
  coApplicantUnavailable: false,
  payments: [
    {
      person: APPLICANT,
      source: 'FK',
      benefit: 'Bostadsbidrag',
      paidOn: '2026-09-25',
      type: 'Månad',
      netAmount: 4500,
      periodFrom: '2026-09-01',
      periodTo: '2026-09-30',
      preliminary: false,
      parts: [],
    },
    {
      person: APPLICANT,
      source: 'PM',
      benefit: 'Efterlevandepension',
      paidOn: '2026-08-18',
      netAmount: 14109,
      grossAmount: 16361,
      taxAmount: 2252,
      periodFrom: '2026-08-01',
      periodTo: '2026-08-31',
      preliminary: false,
      parts: [
        { benefit: 'Efterlevandepension', amountType: 'Änkepension', grossAmount: 4135, days: 31 },
        { benefit: 'Efterlevandepension', amountType: 'Skattefri barnpension', grossAmount: 1685 },
      ],
    },
  ],
};

describe('SsbtekPayments', () => {
  beforeEach(() => {
    vi.mocked(getSsbtekPayments).mockReset();
  });

  it('shows the payments in a table per month they were paid, newest first', async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({ data: VIEW });

    render(<SsbtekPayments errandId="EB-26090036" />);

    expect(await screen.findByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Augusti 2026' })).toBeInTheDocument();
    expect(screen.getByText('Period: 2026-07-01 – 2026-09-30')).toBeInTheDocument();
    expect(getSsbtekPayments).toHaveBeenCalledWith('EB-26090036');

    const [september] = screen.getAllByRole('table');
    if (!september) {
      throw new Error('no table for September');
    }
    const row = within(september).getByRole('row', { name: /Bostadsbidrag/ });
    expect(within(row).getByText('2026-09-25')).toBeInTheDocument();
    expect(within(row).getByText('Månad')).toBeInTheDocument();
    expect(within(row).getByText('4500,00 kr')).toBeInTheDocument();
    expect(within(row).getByText('2026-09-01 – 2026-09-30')).toBeInTheDocument();
  });

  it('has no Person column when the errand has no medsökande', async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({ data: VIEW });

    render(<SsbtekPayments errandId="EB-26090036" />);

    expect(await screen.findByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Person' })).not.toBeInTheDocument();
  });

  it('shows whose each payment is when the errand has a medsökande', async () => {
    const [firstPayment] = VIEW.payments;
    if (!firstPayment) {
      throw new Error('no payment in the fixture');
    }
    vi.mocked(getSsbtekPayments).mockResolvedValue({
      data: {
        ...VIEW,
        hasCoApplicant: true,
        payments: [{ ...firstPayment, person: CO_APPLICANT, benefit: 'Sjukpenning' }, ...VIEW.payments],
      },
    });

    render(<SsbtekPayments errandId="EB-26090036" />);

    expect(await screen.findAllByRole('columnheader', { name: 'Person' })).toHaveLength(2);
    expect(within(screen.getByRole('row', { name: /Sjukpenning/ })).getByText('Medsökande')).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /Bostadsbidrag/ })).getByText('Sökande')).toBeInTheDocument();
  });

  it('says so when SSBTEK could not be read for the medsökande', async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({
      data: { ...VIEW, hasCoApplicant: true, coApplicantUnavailable: true },
    });

    render(<SsbtekPayments errandId="EB-26090036" />);

    expect(
      await screen.findByText('Medsökandes uppgifter kunde inte hämtas från SSBTEK. Bara sökandes betalningar visas.')
    ).toBeInTheDocument();
  });

  it("opens a payment's row to show its delförmåner", async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({ data: VIEW });
    render(<SsbtekPayments errandId="EB-26090036" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Visa delförmåner för Efterlevandepension' }));

    expect(screen.getByRole('heading', { name: 'Delförmån 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delförmån 2' })).toBeInTheDocument();
    expect(screen.getByText('Änkepension')).toBeInTheDocument();
    expect(screen.getByText('4135,00 kr')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('closes a month to hide its table', async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({ data: VIEW });
    render(<SsbtekPayments errandId="EB-26090036" />);

    fireEvent.click(await screen.findByRole('button', { name: 'September 2026' }));

    expect(screen.getAllByRole('table')).toHaveLength(1);
  });

  it('says so when SSBTEK reports no payments in the period', async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({
      data: {
        from: '2026-07-01',
        to: '2026-09-30',
        payments: [],
        hasCoApplicant: false,
        coApplicantUnavailable: false,
      },
    });

    render(<SsbtekPayments errandId="EB-26090036" />);

    expect(await screen.findByText('SSBTEK rapporterar inga betalningar under perioden.')).toBeInTheDocument();
  });

  it("shows careM's reason when SSBTEK could not be read", async () => {
    vi.mocked(getSsbtekPayments).mockResolvedValue({ error: 502, message: 'SSBTEK svarade inte' });

    render(<SsbtekPayments errandId="EB-26090036" />);

    expect(await screen.findByText('SSBTEK svarade inte')).toBeInTheDocument();
  });
});
