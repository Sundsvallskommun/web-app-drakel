import { fireEvent, render, screen } from '@testing-library/react';
import { FC } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

import { SsbtekPanel } from './ssbtek-panel.component';
import { SsbtekPanelProvider, useSsbtekPanel } from './ssbtek-panel-context';

/** Stands in for the header's "Hämta från SSBTEK" button. */
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
  return screen.getByRole('region', { name: 'Hämta från SSBTEK' });
};

describe('SsbtekPanel', () => {
  beforeAll(() => {
    // jsdom has no PointerEvent, so a fired pointer event would lose its clientY; a MouseEvent carries it.
    if (typeof window.PointerEvent === 'undefined') {
      Object.defineProperty(window, 'PointerEvent', { value: MouseEvent, configurable: true });
    }
  });

  it('is hidden until the header button opens it, and the header button closes it again', () => {
    renderPanel();
    expect(screen.queryByRole('region', { name: 'Hämta från SSBTEK' })).not.toBeInTheDocument();

    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'växla' }));

    expect(screen.queryByRole('region', { name: 'Hämta från SSBTEK' })).not.toBeInTheDocument();
  });

  it('closes from its own close button', () => {
    renderPanel();
    openPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Stäng SSBTEK-panelen' }));

    expect(screen.queryByRole('region', { name: 'Hämta från SSBTEK' })).not.toBeInTheDocument();
  });

  it('stops at the right-hand sidebar and says it is only a mock', () => {
    renderPanel();
    const panel = openPanel();

    expect(panel.style.right).toBe('var(--errand-sidebar-width, 0px)');
    expect(screen.getByText('Mockad – ingen koppling mot SSBTEK än')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hämta' })).toBeDisabled();
    expect(screen.getByText('Bostadsbidrag')).toBeInTheDocument();
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
