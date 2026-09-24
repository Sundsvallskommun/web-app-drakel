import { useErrandJobStimulus } from '@hooks/use-errand-job-stimulus';
import { addJobStimulusPeriod } from '@services/job-stimulus-service';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NormberakningJobStimulus } from './normberakning-job-stimulus.component';

vi.mock('@hooks/use-errand-job-stimulus', () => ({ useErrandJobStimulus: vi.fn() }));
vi.mock('@services/job-stimulus-service', () => ({ addJobStimulusPeriod: vi.fn() }));

/** The insats's jobbstimulans periods, as Lifecare lists them. */
const PERIODS = [
  { role: 'APPLICANT' as const, fromDate: '2026-11-01' },
  { role: 'APPLICANT' as const, fromDate: '2025-01-01', toDate: '2025-06-30' },
];

describe('NormberakningJobStimulus', () => {
  const refresh = vi.fn();

  beforeEach(() => {
    refresh.mockReset();
    vi.mocked(useErrandJobStimulus).mockReturnValue({ periods: PERIODS, isLoading: false, refresh });
    vi.mocked(addJobStimulusPeriod).mockReset().mockResolvedValue({ data: [] });
  });

  it('lists the periods oldest first, marking the one that applies to the beräkning’s period', () => {
    render(
      <NormberakningJobStimulus
        errandId="errand-1"
        calculationFrom="2026-11-01"
        calculationTo="2026-11-30"
        onAdded={vi.fn()}
      />
    );

    const [, older, current] = screen.getAllByRole('row');
    if (!older || !current) {
      throw new Error('the periods are not listed');
    }
    expect(older).toHaveTextContent('2025-01-01');
    expect(within(older).queryByText('Gäller beräkningsperioden')).not.toBeInTheDocument();
    expect(current).toHaveTextContent('2026-11-01');
    expect(current).toHaveTextContent('Pågår');
    expect(within(current).getByText('Gäller beräkningsperioden')).toBeInTheDocument();
  });

  it('reads the periods again, and has the tab refreshed, when a period is added', async () => {
    const onAdded = vi.fn();
    render(<NormberakningJobStimulus errandId="errand-1" onAdded={onAdded} />);

    fireEvent.change(screen.getByLabelText('Från *'), { target: { value: '2027-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till period' }));

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalled();
    });
    expect(refresh).toHaveBeenCalled();
  });
});
