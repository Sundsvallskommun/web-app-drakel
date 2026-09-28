import { getErrand } from '@services/errand-service/errand-service';
import { getSsbtekChanges, getSsbtekPayments } from '@services/ssbtek-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { defaultSsbtekMonths, periodOfMonths, recentMonths } from '@utils/ssbtek-period';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SsbtekPaymentsTab } from './ssbtek-payments-tab.component';

vi.mock('@services/errand-service/errand-service', () => ({ getErrand: vi.fn() }));
vi.mock('@services/ssbtek-service', () => ({
  getSsbtekPayments: vi.fn(),
  getSsbtekChanges: vi.fn(),
  transferSsbtekIncomes: vi.fn(),
}));

describe('SsbtekPaymentsTab', () => {
  beforeEach(() => {
    vi.mocked(getErrand).mockResolvedValue({ data: { id: 'errand-uuid-1', errandNumber: 'EB-26090036' } });
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

  it('reads SSBTEK with the errand’s own id when the URL names it by errand number', async () => {
    render(<SsbtekPaymentsTab errandReference="EB-26090036" />);

    await waitFor(() => {
      expect(getSsbtekChanges).toHaveBeenCalledWith('errand-uuid-1');
    });
    expect(getErrand).toHaveBeenCalledWith('EB-26090036');
    expect(getSsbtekPayments).not.toHaveBeenCalledWith('EB-26090036', expect.anything());
  });

  it('reads SSBTEK for month M−2 through the current month to begin with', async () => {
    render(<SsbtekPaymentsTab errandReference="EB-26090036" />);

    await waitFor(() => {
      expect(getSsbtekPayments).toHaveBeenCalledWith('errand-uuid-1', periodOfMonths(defaultSsbtekMonths()));
    });
  });

  it('reads SSBTEK again for the months the handläggare picks, when they ask for it', async () => {
    const [, , , fromMonth = '', toMonth = ''] = recentMonths(5).reverse();
    render(<SsbtekPaymentsTab errandReference="EB-26090036" />);

    fireEvent.change(screen.getByLabelText('Från månad'), { target: { value: fromMonth } });
    fireEvent.change(screen.getByLabelText('Till månad'), { target: { value: toMonth } });
    fireEvent.click(screen.getByRole('button', { name: 'Hämta' }));

    await waitFor(() => {
      expect(getSsbtekPayments).toHaveBeenLastCalledWith('errand-uuid-1', periodOfMonths({ fromMonth, toMonth }));
    });
  });
});
