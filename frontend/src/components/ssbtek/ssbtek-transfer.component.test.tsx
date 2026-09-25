import {
  SsbtekChangesView,
  SsbtekIncomeChangeViewKindEnum,
  SsbtekIncomeChangeViewRoleEnum,
} from '@data-contracts/backend/data-contracts';
import { getSsbtekChanges, transferSsbtekIncomes } from '@services/ssbtek-service';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SsbtekTransfer } from './ssbtek-transfer.component';

vi.mock('@services/ssbtek-service', () => ({ getSsbtekChanges: vi.fn(), transferSsbtekIncomes: vi.fn() }));

const { ADD, CHANGE } = SsbtekIncomeChangeViewKindEnum;
const { APPLICANT, CO_APPLICANT } = SsbtekIncomeChangeViewRoleEnum;

const COMPARISON: SsbtekChangesView = {
  available: true,
  isFinal: false,
  changes: [
    {
      kind: ADD,
      role: APPLICANT,
      incomeTypeId: 12,
      incomeType: 'Bostadsbidrag',
      ssbtekAmount: 4500,
      transferable: true,
    },
    {
      kind: ADD,
      role: CO_APPLICANT,
      incomeTypeId: 20,
      incomeType: 'Underhållsstöd',
      ssbtekAmount: 1673,
      transferable: true,
    },
    {
      kind: CHANGE,
      role: APPLICANT,
      incomeTypeId: 3,
      incomeType: 'Lön',
      ssbtekAmount: 12400,
      lifecareAmount: 11900,
      transferable: false,
    },
  ],
};

describe('SsbtekTransfer', () => {
  beforeEach(() => {
    vi.mocked(getSsbtekChanges).mockReset();
    vi.mocked(transferSsbtekIncomes).mockReset();
  });

  it('lets the handläggare pick only incomes the normberäkning lacks — one already there cannot be picked again', async () => {
    vi.mocked(getSsbtekChanges).mockResolvedValue({ data: COMPARISON });

    render(<SsbtekTransfer errandId="EB-26090036" />);

    expect(await screen.findByRole('checkbox', { name: 'Överför Bostadsbidrag för Sökande' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Överför Underhållsstöd för Medsökande' })).toBeInTheDocument();
    const salaryRow = screen.getByRole('row', { name: /Lön/ });
    expect(within(salaryRow).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(salaryRow).getByText('Överförd – annat belopp i normberäkningen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Överför 0 inkomster' })).toBeDisabled();
  });

  it('transfers the picked incomes and reads the comparison again', async () => {
    vi.mocked(getSsbtekChanges)
      .mockResolvedValueOnce({ data: COMPARISON })
      .mockResolvedValueOnce({
        data: { ...COMPARISON, changes: COMPARISON.changes.slice(1) },
      });
    vi.mocked(transferSsbtekIncomes).mockResolvedValue({
      data: { ...COMPARISON, changes: COMPARISON.changes.slice(1) },
    });
    render(<SsbtekTransfer errandId="EB-26090036" />);

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Överför Bostadsbidrag för Sökande' }));
    fireEvent.click(screen.getByRole('button', { name: 'Överför 1 inkomst' }));

    expect(await screen.findByRole('status')).toHaveTextContent('1 inkomst överfördes till normberäkningen.');
    expect(transferSsbtekIncomes).toHaveBeenCalledWith('EB-26090036', [{ role: 'APPLICANT', incomeTypeId: 12 }]);
    await waitFor(() => {
      expect(getSsbtekChanges).toHaveBeenCalledTimes(2);
    });
  });

  it("shows careM's or the BFF's reason when the transfer is refused", async () => {
    vi.mocked(getSsbtekChanges).mockResolvedValue({ data: COMPARISON });
    vi.mocked(transferSsbtekIncomes).mockResolvedValue({
      error: 409,
      message:
        'Bostadsbidrag finns redan i normberäkningen eller kan inte längre överföras från SSBTEK. Läs in listan igen.',
    });
    render(<SsbtekTransfer errandId="EB-26090036" />);

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Överför Bostadsbidrag för Sökande' }));
    fireEvent.click(screen.getByRole('button', { name: 'Överför 1 inkomst' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Bostadsbidrag finns redan i normberäkningen');
  });

  it('says the normberäkning must be saved in Lifecare before anything can be transferred', async () => {
    vi.mocked(getSsbtekChanges).mockResolvedValue({ data: { available: false, isFinal: false, changes: [] } });

    render(<SsbtekTransfer errandId="EB-26090036" />);

    expect(
      await screen.findByText(
        'Normberäkningen behöver vara sparad i Lifecare innan inkomster kan överföras från SSBTEK.'
      )
    ).toBeInTheDocument();
  });

  it('says so when the normberäkning matches SSBTEK', async () => {
    vi.mocked(getSsbtekChanges).mockResolvedValue({ data: { available: true, isFinal: false, changes: [] } });

    render(<SsbtekTransfer errandId="EB-26090036" />);

    expect(
      await screen.findByText('Normberäkningen stämmer med SSBTEK – det finns inget att överföra.')
    ).toBeInTheDocument();
  });
});
