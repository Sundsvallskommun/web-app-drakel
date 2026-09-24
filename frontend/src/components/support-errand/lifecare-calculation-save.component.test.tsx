import { saveLifecareCalculation } from '@services/lifecare-calculation-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LifecareCalculationSave } from './lifecare-calculation-save.component';

vi.mock('@services/lifecare-calculation-service', () => ({ saveLifecareCalculation: vi.fn() }));

const SAVED = {
  id: 31,
  normName: 'Riksnorm 2026',
  date: '2026-09-24',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  finalized: false,
  updated: '2026-09-24',
};

describe('LifecareCalculationSave', () => {
  beforeEach(() => {
    vi.mocked(saveLifecareCalculation).mockReset();
  });

  it('saves the normberäkning in Lifecare and says so', async () => {
    vi.mocked(saveLifecareCalculation).mockResolvedValue({ data: SAVED });
    const onSaved = vi.fn();
    render(<LifecareCalculationSave errandId="errand-1" saved={null} onSaved={onSaved} />);

    expect(screen.getByText('Normberäkningen är inte sparad i Lifecare än.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Spara normberäkning' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
    expect(saveLifecareCalculation).toHaveBeenCalledWith('errand-1');
  });

  it('shows when and as which beräkning it was saved', () => {
    render(<LifecareCalculationSave errandId="errand-1" saved={SAVED} onSaved={vi.fn()} />);

    expect(screen.getByText('Sparad i Lifecare 2026-09-24 (beräkning 31).')).toBeInTheDocument();
  });

  it('shows why Lifecare or Drakel would not save it', async () => {
    vi.mocked(saveLifecareCalculation).mockResolvedValue({
      error: 422,
      message: 'Lifecare känner inte till: Påhittad kostnad.',
    });
    render(<LifecareCalculationSave errandId="errand-1" saved={null} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Spara normberäkning' }));

    await waitFor(() => {
      expect(screen.getByText('Lifecare känner inte till: Påhittad kostnad.')).toBeInTheDocument();
    });
  });

  it('allows no change once Lifecare holds it as slutlig', () => {
    render(<LifecareCalculationSave errandId="errand-1" saved={{ ...SAVED, finalized: true }} onSaved={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Spara normberäkning' })).toBeDisabled();
  });
});
