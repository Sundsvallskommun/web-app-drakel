import { getSsbtekChanges, getSsbtekPayments } from '@services/ssbtek-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { defaultSsbtekMonths, periodOfMonths, recentMonths } from '@utils/ssbtek-period';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SsbtekPaymentsTab } from './ssbtek-payments-tab.component';

vi.mock('@services/ssbtek-service', () => ({
  getSsbtekPayments: vi.fn(),
  getSsbtekChanges: vi.fn(),
  transferSsbtekIncomes: vi.fn(),
}));

describe('SsbtekPaymentsTab', () => {
  beforeEach(() => {
    vi.mocked(getSsbtekPayments).mockReset();
    vi.mocked(getSsbtekPayments).mockResolvedValue({
      data: {
        payments: [],
        hasCoApplicant: false,
        coApplicantUnavailable: false,
        hasChildren: false,
        unavailableChildren: [],
      },
    });
    vi.mocked(getSsbtekChanges).mockResolvedValue({ data: { available: false, isFinal: false, changes: [] } });
  });

  it('reads SSBTEK for month M−2 through the current month to begin with', async () => {
    render(<SsbtekPaymentsTab errandId="EB-26090036" />);

    await waitFor(() => {
      expect(getSsbtekPayments).toHaveBeenCalledWith('EB-26090036', periodOfMonths(defaultSsbtekMonths()));
    });
  });

  it('reads SSBTEK again for the months the handläggare picks, when they ask for it', async () => {
    const [, , , fromMonth = '', toMonth = ''] = recentMonths(5).reverse();
    render(<SsbtekPaymentsTab errandId="EB-26090036" />);

    fireEvent.change(screen.getByLabelText('Från månad'), { target: { value: fromMonth } });
    fireEvent.change(screen.getByLabelText('Till månad'), { target: { value: toMonth } });
    fireEvent.click(screen.getByRole('button', { name: 'Hämta' }));

    await waitFor(() => {
      expect(getSsbtekPayments).toHaveBeenLastCalledWith('EB-26090036', periodOfMonths({ fromMonth, toMonth }));
    });
  });
});
