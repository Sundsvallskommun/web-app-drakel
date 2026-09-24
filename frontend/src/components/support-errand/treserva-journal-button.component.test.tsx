import { getTreservaJournal } from '@services/treserva-journal-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TreservaJournalButton } from './treserva-journal-button.component';

vi.mock('@services/treserva-journal-service', () => ({ getTreservaJournal: vi.fn() }));

describe('TreservaJournalButton', () => {
  const tab = { location: { href: '' }, close: vi.fn() };

  beforeEach(() => {
    tab.location.href = '';
    tab.close.mockReset();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    window.URL.createObjectURL = vi.fn(() => 'blob:treserva-journal');
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
