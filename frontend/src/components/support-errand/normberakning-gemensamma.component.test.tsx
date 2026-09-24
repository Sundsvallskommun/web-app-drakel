import { updateNormHeader } from '@services/normberakning-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NormberakningGemensamma } from './normberakning-gemensamma.component';

vi.mock('@services/normberakning-service', () => ({ updateNormHeader: vi.fn() }));

describe('NormberakningGemensamma', () => {
  beforeEach(() => {
    vi.mocked(updateNormHeader).mockReset().mockResolvedValue({ data: {} });
  });

  it('shows Lifecare’s gemensamma kostnader for the household size', () => {
    render(
      <NormberakningGemensamma
        errandId="errand-1"
        hasCustomHouseholdSize
        householdSize={4}
        familyMembers={3}
        amountForHouseholdSize={2030}
        commonHouseholdCost={1523}
        onChanged={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Hushållsstorlek')).toHaveValue('4');
    expect(screen.getByText('Belopp för 4 persons hushåll')).toBeInTheDocument();
    expect(screen.getByText(/^1\s?523/)).toBeInTheDocument();
  });

  it('gives the household an own size, starting from its members, and saves a new size', async () => {
    const onChanged = vi.fn();
    const { rerender } = render(
      <NormberakningGemensamma errandId="errand-1" familyMembers={3} onChanged={onChanged} />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Annan hushållsstorlek' }));
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
    expect(updateNormHeader).toHaveBeenCalledWith('errand-1', { hasCustomHouseholdSize: true, householdSize: 3 });

    rerender(
      <NormberakningGemensamma
        errandId="errand-1"
        hasCustomHouseholdSize
        householdSize={3}
        familyMembers={3}
        onChanged={onChanged}
      />
    );
    fireEvent.change(screen.getByLabelText('Hushållsstorlek'), { target: { value: '4' } });
    fireEvent.blur(screen.getByLabelText('Hushållsstorlek'));
    await waitFor(() => {
      expect(updateNormHeader).toHaveBeenCalledWith('errand-1', { hasCustomHouseholdSize: true, householdSize: 4 });
    });
  });

  it('takes the own size off, so the members count again', async () => {
    render(
      <NormberakningGemensamma
        errandId="errand-1"
        hasCustomHouseholdSize
        householdSize={4}
        familyMembers={3}
        onChanged={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Annan hushållsstorlek' }));

    await waitFor(() => {
      expect(updateNormHeader).toHaveBeenCalledWith('errand-1', {
        hasCustomHouseholdSize: false,
        householdSize: undefined,
      });
    });
  });
});
