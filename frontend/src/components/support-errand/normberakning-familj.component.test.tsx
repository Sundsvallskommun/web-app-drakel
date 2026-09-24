import { deleteNormRow, updateNormRow } from '@services/normberakning-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NormberakningFamilj } from './normberakning-familj.component';

vi.mock('@services/normberakning-service', () => ({ deleteNormRow: vi.fn(), updateNormRow: vi.fn() }));

const PERSONS = [
  {
    id: '1',
    personalNumber: '880209-T050',
    name: 'Testsson, Test',
    included: true,
    amount: 3940,
    normRowId: 2,
    normInterval: 'Ensamstående',
  },
  {
    id: '2',
    personalNumber: '141201-T010',
    name: 'Testbarn Test, Testar',
    included: true,
    amount: 4390,
    normRowId: 12,
    normInterval: 'Barn 11-14',
  },
];

/** The norm's rows, as Lifecare names them. */
const NORM_ROWS = [
  { id: 2, name: 'Ensamstående 3940.00' },
  { id: 11, name: 'Barn 7-10 år 3820.00' },
  { id: 12, name: 'Barn 11-14 4390.00' },
];

describe('NormberakningFamilj', () => {
  beforeEach(() => {
    vi.mocked(updateNormRow).mockReset().mockResolvedValue({ data: {} });
    vi.mocked(deleteNormRow).mockReset().mockResolvedValue({ data: {} });
  });

  it('shows who the norm covers without Omfattas or Ingår från/till', () => {
    render(<NormberakningFamilj persons={PERSONS} errandId="errand-1" />);

    expect(screen.getByText('Testbarn Test, Testar')).toBeInTheDocument();
    expect(screen.queryByText('Omfattas')).not.toBeInTheDocument();
    expect(screen.queryByText('Ingår från')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('saves a member’s days in Lifecare, and the normintervall picked', async () => {
    const onChanged = vi.fn();
    render(
      <NormberakningFamilj persons={PERSONS} errandId="errand-1" normRows={NORM_ROWS} editable onChanged={onChanged} />
    );

    const [, childDays] = screen.getAllByRole('textbox', { name: 'Dagar' });
    if (!childDays) {
      throw new Error('the bonusbarn has no Dagar field');
    }
    fireEvent.change(childDays, { target: { value: '10' } });
    fireEvent.blur(childDays);
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
    expect(updateNormRow).toHaveBeenCalledWith('errand-1', 'persons', '2', { caseworkerDays: 10, normRowId: 12 });

    const [, childNorm] = screen.getAllByRole('combobox', { name: 'Normintervall/Belopp' });
    if (!childNorm) {
      throw new Error('the bonusbarn has no Normintervall field');
    }
    fireEvent.change(childNorm, { target: { value: '11' } });
    await waitFor(() => {
      expect(updateNormRow).toHaveBeenCalledWith('errand-1', 'persons', '2', { caseworkerDays: 10, normRowId: 11 });
    });
  });

  it('takes out anyone but the sökande', async () => {
    render(
      <NormberakningFamilj persons={PERSONS} errandId="errand-1" normRows={NORM_ROWS} editable onChanged={vi.fn()} />
    );

    expect(screen.queryByRole('button', { name: 'Ta bort Testsson, Test ur normberäkningen' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ta bort Testbarn Test, Testar ur normberäkningen' }));
    await waitFor(() => {
      expect(deleteNormRow).toHaveBeenCalledWith('errand-1', 'persons', '2');
    });
  });
});
