import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { JobStimulusIncomeNote } from './job-stimulus-income-note.component';

describe('JobStimulusIncomeNote', () => {
  it('shows what jobbstimulans takes off the gross, and what Lifecare counts', () => {
    render(<JobStimulusIncomeNote deduction={1250} counted={3750} />);

    expect(screen.getByText(/Jobbstimulans −1\s?250,00/)).toBeInTheDocument();
    expect(screen.getByText(/Räknas 3\s?750,00/)).toBeInTheDocument();
  });

  it('shows nothing on an income jobbstimulans takes nothing off', () => {
    const { container } = render(<JobStimulusIncomeNote />);

    expect(container).toBeEmptyDOMElement();
  });
});
