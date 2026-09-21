import { getPreviousNormberakning } from '@services/normberakning-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PreviousNormberakningCheckbox } from './previous-normberakning-box.component';
import { PreviousNormberakningProvider } from './previous-normberakning-context';
import { PreviousNormberakningIncomes } from './previous-normberakning-sections.component';

vi.mock('@services/normberakning-service', () => ({
  getPreviousNormberakning: vi.fn(),
}));

const PREVIOUS_CALCULATION = {
  id: 42,
  fromDate: '2026-05-01',
  toDate: '2026-05-31',
  incomeSum: 12345,
  incomes: [{ type: 'Lön', amountApplicant: 10000, applicantSearchDate: '2026-04-20', amountCoApplicant: 2345 }],
};

const renderSection = () =>
  render(
    <PreviousNormberakningProvider errandId="errand-1">
      <PreviousNormberakningCheckbox />
      <PreviousNormberakningIncomes />
    </PreviousNormberakningProvider>
  );

describe('previous normberäkning', () => {
  beforeEach(() => {
    vi.mocked(getPreviousNormberakning).mockReset();
    vi.mocked(getPreviousNormberakning).mockResolvedValue({ data: PREVIOUS_CALCULATION });
  });

  it('fetches nothing until the toggle is ticked', () => {
    renderSection();

    expect(getPreviousNormberakning).not.toHaveBeenCalled();
    expect(screen.queryByText('Föregående: Inkomster')).not.toBeInTheDocument();
  });

  it('loads once and shows the rows and period when the toggle is ticked', async () => {
    renderSection();

    fireEvent.click(screen.getByLabelText('Jämför normberäkning med föregående månad'));

    await waitFor(() => {
      expect(screen.getByText('Lön')).toBeInTheDocument();
    });
    expect(getPreviousNormberakning).toHaveBeenCalledTimes(1);
    expect(screen.getByText('10000,00')).toBeInTheDocument();
    expect(screen.getByText('2345,00')).toBeInTheDocument();
    expect(screen.getByText(/2026-05-01 – 2026-05-31/)).toBeInTheDocument();
  });

  it('hides the section when unticked and loads fresh data when ticked again', async () => {
    renderSection();
    const toggle = screen.getByLabelText('Jämför normberäkning med föregående månad');

    fireEvent.click(toggle);
    await waitFor(() => {
      expect(screen.getByText('Lön')).toBeInTheDocument();
    });

    fireEvent.click(toggle);
    expect(screen.queryByText('Lön')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    await waitFor(() => {
      expect(screen.getByText('Lön')).toBeInTheDocument();
    });
    // Re-showing refetches rather than reusing what was loaded before, so a calculation committed in
    // Lifecare meanwhile is picked up.
    expect(getPreviousNormberakning).toHaveBeenCalledTimes(2);
  });

  it('reports that there is no earlier calculation instead of an empty table', async () => {
    vi.mocked(getPreviousNormberakning).mockResolvedValue({ data: null });
    renderSection();

    fireEvent.click(screen.getByLabelText('Jämför normberäkning med föregående månad'));

    await waitFor(() => {
      expect(screen.getByText('Det finns ingen tidigare normberäkning för den sökande.')).toBeInTheDocument();
    });
  });
});
