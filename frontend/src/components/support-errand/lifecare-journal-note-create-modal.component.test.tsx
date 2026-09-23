import { createLifecareJournalNote, getLifecareJournalNoteTypes } from '@services/lifecare-documents-service';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LifecareJournalNoteCreateModal } from './lifecare-journal-note-create-modal.component';

// The rich-text editor loads Quill through next/dynamic; a plain textarea stands in for it, since what is
// under test is the dialog around the editor.
vi.mock('next/dynamic', () => ({
  default: () => {
    const EditorStub = ({ onChange }: { onChange: (value: TextEditorValue) => void }) => (
      <textarea
        aria-label="editor"
        onChange={(event) => {
          onChange({ markup: `<p>${event.target.value}</p>`, plainText: event.target.value });
        }}
      />
    );
    return EditorStub;
  },
}));

vi.mock('@services/lifecare-documents-service', () => ({
  getLifecareJournalNoteTypes: vi.fn(),
  createLifecareJournalNote: vi.fn(),
}));

const fillIn = async () => {
  await waitFor(() => {
    expect(screen.getByRole('option', { name: 'Journalanteckning' })).toBeInTheDocument();
  });
  fireEvent.change(screen.getByLabelText('Typ *'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('editor'), { target: { value: 'Ringde sökande' } });
};

describe('LifecareJournalNoteCreateModal', () => {
  beforeEach(() => {
    vi.mocked(getLifecareJournalNoteTypes).mockReset();
    vi.mocked(getLifecareJournalNoteTypes).mockResolvedValue({
      data: [
        { code: 3, name: 'Beslut', protectedByDefault: true },
        { code: 1, name: 'Journalanteckning', protectedByDefault: false },
      ],
    });
    vi.mocked(createLifecareJournalNote).mockReset();
  });

  it('writes the note with the Lifecare note type that was picked', async () => {
    vi.mocked(createLifecareJournalNote).mockResolvedValue({ data: null });
    const onCreated = vi.fn();
    render(<LifecareJournalNoteCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={onCreated} />);

    await fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Skapa' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
    });
    expect(createLifecareJournalNote).toHaveBeenCalledWith(
      'errand-1',
      expect.objectContaining({ noteTypeCode: 1, title: 'Journalanteckning', content: '<p>Ringde sökande</p>' })
    );
  });

  it('sends the rubrik and time the handläggare wrote', async () => {
    vi.mocked(createLifecareJournalNote).mockResolvedValue({ data: null });
    render(<LifecareJournalNoteCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={vi.fn()} />);

    await fillIn();
    fireEvent.change(screen.getByLabelText('Rubrik *'), { target: { value: 'Telefonsamtal' } });
    fireEvent.change(screen.getByLabelText('Tid'), { target: { value: '11:50' } });
    // A rubrik of their own survives picking another type.
    fireEvent.change(screen.getByLabelText('Typ *'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Skapa' }));

    await waitFor(() => {
      expect(createLifecareJournalNote).toHaveBeenCalledWith(
        'errand-1',
        expect.objectContaining({ noteTypeCode: 3, title: 'Telefonsamtal', occurenceTime: '11:50' })
      );
    });
  });

  it('saves the note skrivskyddad when the handläggare ticks it', async () => {
    vi.mocked(createLifecareJournalNote).mockResolvedValue({ data: null });
    render(<LifecareJournalNoteCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={vi.fn()} />);

    await fillIn();
    expect(screen.getByRole('checkbox', { name: 'Spara skrivskyddad' })).not.toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Spara skrivskyddad' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skapa' }));

    await waitFor(() => {
      expect(createLifecareJournalNote).toHaveBeenCalledWith('errand-1', expect.objectContaining({ protected: true }));
    });
  });

  it('starts skrivskyddad for a note type Lifecare protects by default', async () => {
    render(<LifecareJournalNoteCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={vi.fn()} />);

    await fillIn();
    fireEvent.change(screen.getByLabelText('Typ *'), { target: { value: '3' } });

    expect(screen.getByRole('checkbox', { name: 'Spara skrivskyddad' })).toBeChecked();
  });

  it('keeps the text and shows the reason Lifecare gave when it refuses the note', async () => {
    vi.mocked(createLifecareJournalNote).mockResolvedValue({ error: 400, message: 'Datum ligger i framtiden' });
    const onCreated = vi.fn();
    render(<LifecareJournalNoteCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={onCreated} />);

    await fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Skapa' }));

    await waitFor(() => {
      expect(screen.getByText('Datum ligger i framtiden')).toBeInTheDocument();
    });
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByLabelText('editor')).toHaveValue('Ringde sökande');
  });

  it('holds the create button until a type and some text are given', async () => {
    render(<LifecareJournalNoteCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Journalanteckning' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Skapa' })).toBeDisabled();
  });
});
