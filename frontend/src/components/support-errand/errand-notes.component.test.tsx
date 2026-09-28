import { createNote } from '@services/note-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandNotes } from './errand-notes.component';

vi.mock('@services/note-service', () => ({ createNote: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn() }));

const NOTES = [{ id: 'note-1', body: 'Ringde sökande', author: 'Test Handläggare', created: '2026-09-01T10:00:00Z' }];

const renderNotes = (readOnly?: boolean, refresh = vi.fn()) =>
  render(
    <ErrandNotes
      errandId="errand-1"
      readOnly={readOnly}
      notes={NOTES}
      isLoading={false}
      loadError={false}
      refresh={refresh}
    />
  );

describe('ErrandNotes', () => {
  beforeEach(() => {
    vi.mocked(createNote).mockReset().mockResolvedValue({ data: null });
  });

  it('writes a new note', async () => {
    const refresh = vi.fn();
    renderNotes(false, refresh);

    fireEvent.change(screen.getByRole('textbox', { name: 'Ny anteckning' }), { target: { value: 'Ny uppgift' } });
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(createNote).toHaveBeenCalledWith('errand-1', 'Ny uppgift');
  });

  it('shows the notes but offers no writing, changing or removing to a handläggare who may only read', () => {
    renderNotes(true);

    expect(screen.getByText('Ringde sökande')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Ny anteckning' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Spara' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ändra anteckning|Ta bort anteckning/ })).not.toBeInTheDocument();
  });
});
