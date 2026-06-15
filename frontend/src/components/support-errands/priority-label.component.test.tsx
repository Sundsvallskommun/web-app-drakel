import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PriorityLabel } from './priority-label.component';

describe('PriorityLabel', () => {
  it('renders the Swedish label for a known priority', () => {
    render(<PriorityLabel priority="HIGH" />);
    expect(screen.getByText('Hög')).toBeInTheDocument();
  });

  it('renders the raw value for an unknown priority', () => {
    render(<PriorityLabel priority="URGENT" />);
    expect(screen.getByText('URGENT')).toBeInTheDocument();
  });

  it('falls back to a dash when priority is missing', () => {
    render(<PriorityLabel />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
