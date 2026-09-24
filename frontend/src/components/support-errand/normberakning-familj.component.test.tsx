import { deleteNormRow, updateNormRow } from '@services/normberakning-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NormberakningFamilj } from './normberakning-familj.component';

vi.mock('@services/normberakning-service', () => ({ deleteNormRow: vi.fn(), updateNormRow: vi.fn() }));

const PERSONS = [
  { id: '1', personalNumber: '880209-T050', name: 'Testsson, Test', included: true, amount: 3940 },
  { id: '2', personalNumber: '141201-T010', name: 'Testbarn Test, Testar', included: true, amount: 2150 },
];

describe('NormberakningFamilj', () => {
  beforeEach(() => {
    vi.mocked(updateNormRow).mockReset().mockResolvedValue({ data: {} });
    vi.mocked(deleteNormRow).mockReset().mockResolvedValue({ data: {} });
  });

  it("shows careM's draft without anything to change", () => {
    render(<NormberakningFamilj persons={PERSONS} errandId="errand-1" />);

    expect(screen.getByText('Testbarn Test, Testar')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('saves in Lifecare whether a member is in the beräkning, and takes out anyone but the sökande', async () => {
    const onChanged = vi.fn();
    render(<NormberakningFamilj persons={PERSONS} errandId="errand-1" editable onChanged={onChanged} />);

    const [, childIncluded] = screen.getAllByRole('checkbox', { name: 'Omfattas' });
    if (!childIncluded) {
      throw new Error('the bonusbarn has no Omfattas checkbox');
    }
    fireEvent.click(childIncluded);
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
    expect(updateNormRow).toHaveBeenCalledWith('errand-1', 'persons', '2', {
      included: false,
      deviationFromDate: undefined,
      deviationToDate: undefined,
    });

    expect(screen.queryByRole('button', { name: 'Ta bort Testsson, Test ur normberäkningen' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ta bort Testbarn Test, Testar ur normberäkningen' }));
    await waitFor(() => {
      expect(deleteNormRow).toHaveBeenCalledWith('errand-1', 'persons', '2');
    });
  });
});
