import { fireEvent, render, screen } from '@testing-library/react';
import { useParams, usePathname } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SsbtekButton } from './ssbtek-button.component';
import { SsbtekPanelProvider } from './ssbtek-panel-context';

vi.mock('next/navigation', () => ({ useParams: vi.fn(), usePathname: vi.fn() }));

const renderButton = (): void => {
  render(
    <SsbtekPanelProvider>
      <SsbtekButton />
    </SsbtekPanelProvider>
  );
};

describe('SsbtekButton', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ locale: 'sv', errandId: 'EB-26090036' });
    vi.mocked(usePathname).mockReturnValue('/sv/arende/EB-26090036');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the errand's SSBTEK page in a new tab, so the errand stays open", () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Hämta från SSBTEK' }));

    expect(open).toHaveBeenCalledWith(
      expect.stringMatching(/\/sv\/arende\/EB-26090036\/ssbtek$/),
      '_blank',
      'noopener'
    );
  });

  it('is not shown outside an errand', () => {
    vi.mocked(useParams).mockReturnValue({ locale: 'sv' });
    vi.mocked(usePathname).mockReturnValue('/sv/oversikt');

    renderButton();

    expect(screen.queryByRole('button', { name: 'Hämta från SSBTEK' })).not.toBeInTheDocument();
  });

  it('is not shown on the SSBTEK page itself', () => {
    vi.mocked(usePathname).mockReturnValue('/sv/arende/EB-26090036/ssbtek');

    renderButton();

    expect(screen.queryByRole('button', { name: 'Hämta från SSBTEK' })).not.toBeInTheDocument();
  });
});
