import { updateNormRow } from '@services/normberakning-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NormberakningIncomes } from './normberakning-incomes.component';

vi.mock('@services/normberakning-service', () => ({
  addNormRow: vi.fn(),
  deleteNormRow: vi.fn(),
  restoreNormRow: vi.fn(),
  updateNormRow: vi.fn(),
}));

/** A beräkning in Lifecare where the sökande has jobbstimulans: 5 000 gross lön, counted 3 750 at 25 %. */
const ROWS = [
  {
    id: '1',
    typeName: 'Lön efter skatt',
    applicantCaseworkerAmount: 5000,
    applicantJobStimulus: true,
    applicantCountedAmount: 3750,
  },
  { id: '19', typeName: 'Aktivitetsstöd', applicantCaseworkerAmount: 5600 },
];

describe('NormberakningIncomes', () => {
  beforeEach(() => {
    vi.mocked(updateNormRow).mockReset().mockResolvedValue({ data: {} });
  });

  it('shows Brutto S as Lifecare does when the sökande has jobbstimulans, with the counted Belopp S', () => {
    render(
      <NormberakningIncomes errandId="errand-1" rows={ROWS} incomeTypes={[]} applicantJobStimulus onChanged={vi.fn()} />
    );

    expect(screen.getByRole('columnheader', { name: 'Brutto S' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Brutto S' })).toHaveValue('5000');
    expect(screen.getByText(/3\s?750,00/)).toBeInTheDocument();
  });

  it('saves the gross from Brutto S', async () => {
    const onChanged = vi.fn();
    render(
      <NormberakningIncomes
        errandId="errand-1"
        rows={ROWS}
        incomeTypes={[]}
        applicantJobStimulus
        onChanged={onChanged}
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Brutto S' }), { target: { value: '6000' } });
    fireEvent.blur(screen.getByRole('textbox', { name: 'Brutto S' }));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
    expect(vi.mocked(updateNormRow).mock.calls[0]?.slice(0, 3)).toEqual(['errand-1', 'incomes', '1']);
    expect(vi.mocked(updateNormRow).mock.calls[0]?.[3]).toMatchObject({ applicantCaseworkerAmount: 6000 });
  });

  it('has no Brutto S column when the sökande has no jobbstimulans', () => {
    render(<NormberakningIncomes errandId="errand-1" rows={[ROWS[1] ?? {}]} incomeTypes={[]} onChanged={vi.fn()} />);

    expect(screen.queryByRole('columnheader', { name: 'Brutto S' })).not.toBeInTheDocument();
  });
});
