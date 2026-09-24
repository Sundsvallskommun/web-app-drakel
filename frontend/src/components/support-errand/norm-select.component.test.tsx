import { updateNormHeader } from '@services/normberakning-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NormSelect } from './norm-select.component';

vi.mock('@services/normberakning-service', () => ({ updateNormHeader: vi.fn() }));

/** Lifecare's norms for the insats. */
const NORMS = [
  { code: '1', displayName: 'Riksnorm 2026' },
  { code: '6', displayName: 'Specnorm' },
];

describe('NormSelect', () => {
  beforeEach(() => {
    vi.mocked(updateNormHeader).mockReset().mockResolvedValue({ data: {} });
  });

  it('offers Lifecare’s norms and saves the one picked', async () => {
    const onChanged = vi.fn();
    render(<NormSelect errandId="errand-1" normId={1} norms={NORMS} onChanged={onChanged} />);

    expect(screen.getByRole('combobox', { name: 'Norm' })).toHaveValue('1');
    fireEvent.change(screen.getByRole('combobox', { name: 'Norm' }), { target: { value: '6' } });

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
    expect(updateNormHeader).toHaveBeenCalledWith('errand-1', { normId: 6 });
  });

  it('shows the norm the beräkning has until Lifecare’s list is there', () => {
    render(<NormSelect errandId="errand-1" normId={1} normName="Riksnorm 2026" norms={[]} onChanged={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Norm' })).toHaveDisplayValue('Riksnorm 2026');
    expect(screen.getByRole('combobox', { name: 'Norm' })).toBeDisabled();
  });
});
