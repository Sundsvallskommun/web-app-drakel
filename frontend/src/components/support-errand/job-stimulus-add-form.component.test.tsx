import { addJobStimulusPeriod } from '@services/job-stimulus-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { JobStimulusAddForm } from './job-stimulus-add-form.component';

vi.mock('@services/job-stimulus-service', () => ({ addJobStimulusPeriod: vi.fn() }));

describe('JobStimulusAddForm', () => {
  beforeEach(() => {
    vi.mocked(addJobStimulusPeriod).mockReset();
  });

  it('adds a period without an end, leaving it to Lifecare’s two-year rule', async () => {
    vi.mocked(addJobStimulusPeriod).mockResolvedValue({ data: [] });
    const onAdded = vi.fn();
    render(<JobStimulusAddForm errandId="errand-1" onAdded={onAdded} />);

    fireEvent.change(screen.getByLabelText('Från *'), { target: { value: '2028-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till period' }));

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalled();
    });
    expect(addJobStimulusPeriod).toHaveBeenCalledWith('errand-1', { fromDate: '2028-01-15', toDate: undefined });
  });

  it('holds the button until a start is given', () => {
    render(<JobStimulusAddForm errandId="errand-1" onAdded={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Lägg till period' })).toBeDisabled();
  });

  it('shows why Lifecare or Drakel would not add the period', async () => {
    vi.mocked(addJobStimulusPeriod).mockResolvedValue({
      error: 422,
      message: 'Hushållet har en medsökande. Jobbstimulans kan inte ändras från Drakel för sådana hushåll ännu.',
    });
    render(<JobStimulusAddForm errandId="errand-1" onAdded={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Från *'), { target: { value: '2028-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till period' }));

    await waitFor(() => {
      expect(screen.getByText(/Hushållet har en medsökande/)).toBeInTheDocument();
    });
  });
});
