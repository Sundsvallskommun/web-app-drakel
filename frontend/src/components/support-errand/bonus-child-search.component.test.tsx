import { addBonusChild, findHouseholdCandidates } from '@services/lifecare-household-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BonusChildSearch } from './bonus-child-search.component';

vi.mock('@services/lifecare-household-service', () => ({ addBonusChild: vi.fn(), findHouseholdCandidates: vi.fn() }));

const CHILD = { personId: '20141201T010', personalNumber: '141201-T010', name: 'Testbarn Test, Testar' };

describe('BonusChildSearch', () => {
  beforeEach(() => {
    vi.mocked(findHouseholdCandidates).mockReset();
    vi.mocked(addBonusChild).mockReset();
  });

  it('searches Lifecare and adds the person picked as a bonusbarn', async () => {
    vi.mocked(findHouseholdCandidates).mockResolvedValue({ data: [CHILD] });
    vi.mocked(addBonusChild).mockResolvedValue({ data: null });
    const onAdded = vi.fn();
    render(<BonusChildSearch errandId="errand-1" onAdded={onAdded} />);

    fireEvent.change(screen.getByPlaceholderText('Namn eller personnummer'), { target: { value: 'barn' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sök' }));
    await waitFor(() => {
      expect(screen.getByText('Testbarn Test, Testar')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till som bonusbarn' }));

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalled();
    });
    expect(findHouseholdCandidates).toHaveBeenCalledWith('errand-1', 'barn');
    // The personnummer goes in the request body, never the URL.
    expect(addBonusChild).toHaveBeenCalledWith('errand-1', '20141201T010');
  });

  it("shows Lifecare's reason when the bonusbarn could not be added", async () => {
    vi.mocked(findHouseholdCandidates).mockResolvedValue({ data: [CHILD] });
    vi.mocked(addBonusChild).mockResolvedValue({ error: 422, message: 'Personen finns redan i hushållet.' });
    const onAdded = vi.fn();
    render(<BonusChildSearch errandId="errand-1" onAdded={onAdded} />);

    fireEvent.change(screen.getByPlaceholderText('Namn eller personnummer'), { target: { value: 'barn' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sök' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lägg till som bonusbarn' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till som bonusbarn' }));

    await waitFor(() => {
      expect(screen.getByText('Personen finns redan i hushållet.')).toBeInTheDocument();
    });
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('does not search on a single character', () => {
    render(<BonusChildSearch errandId="errand-1" onAdded={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Namn eller personnummer'), { target: { value: 'b' } });

    expect(screen.getByRole('button', { name: 'Sök' })).toBeDisabled();
  });
});
