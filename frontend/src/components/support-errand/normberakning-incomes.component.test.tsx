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
    expect(screen.getByRole('textbox', { name: 'Brutto S' })).toHaveValue('5000,00');
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

  it('does not save a row again when its amount is unchanged, however it is written', () => {
    render(
      <NormberakningIncomes
        errandId="errand-1"
        rows={[{ id: '7', typeName: 'Lön', applicantCaseworkerAmount: 1234.5 }]}
        incomeTypes={[]}
        onChanged={vi.fn()}
      />
    );
    const amountField = screen.getByDisplayValue('1234,50');

    fireEvent.blur(amountField);
    fireEvent.change(amountField, { target: { value: '1 234,5' } });
    fireEvent.blur(amountField);

    expect(updateNormRow).not.toHaveBeenCalled();
  });

  it('reads an amount written with a space between the thousands', async () => {
    const onChanged = vi.fn();
    render(
      <NormberakningIncomes
        errandId="errand-1"
        rows={[{ id: '7', typeName: 'Lön', applicantCaseworkerAmount: 1000 }]}
        incomeTypes={[]}
        onChanged={onChanged}
      />
    );
    const amountField = screen.getByDisplayValue('1000,00');

    fireEvent.change(amountField, { target: { value: '12 500' } });
    fireEvent.blur(amountField);

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
    expect(vi.mocked(updateNormRow).mock.calls[0]?.[3]).toMatchObject({ applicantCaseworkerAmount: 12500 });
  });

  it('does not send an amount it cannot read, and says so', () => {
    render(
      <NormberakningIncomes
        errandId="errand-1"
        rows={[{ id: '7', typeName: 'Lön', applicantCaseworkerAmount: 1000 }]}
        incomeTypes={[]}
        onChanged={vi.fn()}
      />
    );
    const amountField = screen.getByDisplayValue('1000,00');

    fireEvent.change(amountField, { target: { value: 'tolvhundra' } });
    fireEvent.blur(amountField);

    expect(updateNormRow).not.toHaveBeenCalled();
    expect(screen.getByText('Ange beloppet med siffror, t.ex. 1 234,50')).toBeInTheDocument();
  });

  it('has no Brutto S column when the sökande has no jobbstimulans', () => {
    render(<NormberakningIncomes errandId="errand-1" rows={[ROWS[1] ?? {}]} incomeTypes={[]} onChanged={vi.fn()} />);

    expect(screen.queryByRole('columnheader', { name: 'Brutto S' })).not.toBeInTheDocument();
  });
});
