import { getTreservaJournal } from '@services/treserva-journal-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TreservaJournalButton } from './treserva-journal-button.component';

vi.mock('@services/treserva-journal-service', () => ({ getTreservaJournal: vi.fn() }));

describe('TreservaJournalButton', () => {
  const tab = { location: { href: '' }, close: vi.fn() };
  // jsdom has no object URLs.
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:treserva-journal');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    tab.location.href = '';
    tab.close.mockReset();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    createObjectURL.mockReset().mockReturnValue('blob:treserva-journal');
    revokeObjectURL.mockReset();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the journal from Treserva as a PDF in a new tab', async () => {
    vi.mocked(getTreservaJournal).mockResolvedValue({ data: btoa('%PDF-1.7') });
    render(<TreservaJournalButton errandId="errand-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Journal från Treserva' }));

    await waitFor(() => {
      expect(tab.location.href).toBe('blob:treserva-journal');
    });
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(getTreservaJournal).toHaveBeenCalledWith('errand-1');
  });

  it('revokes the journal opened before when it is opened again, and the last one on unmount', async () => {
    vi.mocked(getTreservaJournal).mockResolvedValue({ data: btoa('%PDF-1.7') });
    createObjectURL.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
    const { unmount } = render(<TreservaJournalButton errandId="errand-1" />);
    const button = screen.getByRole('button', { name: 'Journal från Treserva' });

    fireEvent.click(button);
    await waitFor(() => {
      expect(tab.location.href).toBe('blob:first');
    });
    fireEvent.click(button);
    await waitFor(() => {
      expect(tab.location.href).toBe('blob:second');
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');

    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:second');
  });

  it('closes the tab again and says why when the journal cannot be read', async () => {
    vi.mocked(getTreservaJournal).mockResolvedValue({ error: 502 });
    render(<TreservaJournalButton errandId="errand-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Journal från Treserva' }));

    await waitFor(() => {
      expect(screen.getByText('Journalen från Treserva kunde inte hämtas')).toBeInTheDocument();
    });
    expect(tab.close).toHaveBeenCalled();
  });
});
