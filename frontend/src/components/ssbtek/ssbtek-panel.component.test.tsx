import { getSsbtekPayments } from '@services/ssbtek-service';
import { fireEvent, render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { FC } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SsbtekPanel } from './ssbtek-panel.component';
import { SsbtekPanelProvider, useSsbtekPanel } from './ssbtek-panel-context';

vi.mock('next/navigation', () => ({ useParams: vi.fn() }));
vi.mock('@services/ssbtek-service', () => ({ getSsbtekPayments: vi.fn() }));

/** Stands in for the header's "Hämta från SSBTEK" button, when SSBTEK opens on the errand. */
const ToggleButton: FC = () => {
  const { toggle } = useSsbtekPanel();
  return (
    <button type="button" onClick={toggle}>
      växla
    </button>
  );
};

const renderPanel = (): void => {
  render(
    <SsbtekPanelProvider>
      <ToggleButton />
      <SsbtekPanel />
    </SsbtekPanelProvider>
  );
};

const openPanel = (): HTMLElement => {
  fireEvent.click(screen.getByRole('button', { name: 'växla' }));
  return screen.getByRole('region', { name: 'Uppgifter från SSBTEK' });
};

describe('SsbtekPanel', () => {
  beforeAll(() => {
    // jsdom has no PointerEvent, so a fired pointer event would lose its clientY; a MouseEvent carries it.
    if (typeof window.PointerEvent === 'undefined') {
      Object.defineProperty(window, 'PointerEvent', { value: MouseEvent, configurable: true });
    }
  });

  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ locale: 'sv', errandId: 'EB-26090036' });
    vi.mocked(getSsbtekPayments).mockResolvedValue({ data: { payments: [] } });
  });

  it('is hidden until the header button opens it, and the header button closes it again', () => {
    renderPanel();
    expect(screen.queryByRole('region', { name: 'Uppgifter från SSBTEK' })).not.toBeInTheDocument();

    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'växla' }));

    expect(screen.queryByRole('region', { name: 'Uppgifter från SSBTEK' })).not.toBeInTheDocument();
  });

  it('closes from its own close button', () => {
    renderPanel();
    openPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Stäng SSBTEK-panelen' }));

    expect(screen.queryByRole('region', { name: 'Uppgifter från SSBTEK' })).not.toBeInTheDocument();
  });

  it("stops at the right-hand sidebar and shows the errand's SSBTEK payments", async () => {
    renderPanel();
    const panel = openPanel();

    expect(panel.style.right).toBe('var(--errand-sidebar-width, 0px)');
    expect(await screen.findByText('SSBTEK rapporterar inga betalningar under perioden.')).toBeInTheDocument();
    expect(getSsbtekPayments).toHaveBeenCalledWith('EB-26090036');
  });

  it('grows when its top edge is dragged up and never shrinks below a strip', () => {
    renderPanel();
    const panel = openPanel();
    const handle = screen.getByRole('separator', { name: 'Dra för att ändra panelens höjd' });

    fireEvent.pointerDown(handle, { clientY: 500 });
    fireEvent.pointerMove(window, { clientY: 400 });
    fireEvent.pointerUp(window);
    expect(panel.style.height).toBe('460px');

    fireEvent.pointerDown(handle, { clientY: 400 });
    fireEvent.pointerMove(window, { clientY: 1400 });
    fireEvent.pointerUp(window);
    expect(panel.style.height).toBe('160px');
  });
});
