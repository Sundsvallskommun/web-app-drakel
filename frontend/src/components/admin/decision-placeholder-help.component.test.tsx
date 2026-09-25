import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DecisionPlaceholderHelp } from './decision-placeholder-help.component';

const writeText = vi.fn<(text: string) => Promise<void>>();

describe('DecisionPlaceholderHelp', () => {
  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  it('lists each character the beslut replaces, with what it is replaced by', () => {
    render(<DecisionPlaceholderHelp />);

    expect(screen.getByText('Sökandes namn')).toBeInTheDocument();
    expect(screen.getByText('Beloppet')).toBeInTheDocument();
    expect(screen.getByText('Perioden')).toBeInTheDocument();
  });

  it('copies a character for the admin to paste into the formulering', async () => {
    writeText.mockResolvedValue(undefined);
    render(<DecisionPlaceholderHelp />);

    fireEvent.click(screen.getByRole('button', { name: 'Kopiera ¥ för beloppet' }));

    expect(writeText).toHaveBeenCalledWith('¥');
    expect(await screen.findByRole('status')).toHaveTextContent('¥ är kopierat');
    expect(screen.getByRole('button', { name: 'Kopiera ¥ för beloppet' })).toHaveTextContent('Kopierat');
  });

  it('says so when the character could not be copied', async () => {
    writeText.mockRejectedValue(new Error('not allowed'));
    render(<DecisionPlaceholderHelp />);

    fireEvent.click(screen.getByRole('button', { name: 'Kopiera ¤ för sökandes namn' }));

    expect(
      await screen.findByText('Tecknet kunde inte kopieras. Markera det och kopiera det själv.')
    ).toBeInTheDocument();
  });
});
