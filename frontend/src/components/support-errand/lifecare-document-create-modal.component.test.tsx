import { createLifecareDocument, getLifecareDocumentTypes } from '@services/lifecare-documents-service';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LifecareDocumentCreateModal } from './lifecare-document-create-modal.component';

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
  getLifecareDocumentTypes: vi.fn(),
  createLifecareDocument: vi.fn(),
}));

const fillIn = async (typeCode: string) => {
  await waitFor(() => {
    expect(screen.getByRole('option', { name: 'EK Brev' })).toBeInTheDocument();
  });
  fireEvent.change(screen.getByLabelText('Typ *'), { target: { value: typeCode } });
  fireEvent.change(screen.getByLabelText('editor'), { target: { value: 'Hej' } });
};

describe('LifecareDocumentCreateModal', () => {
  beforeEach(() => {
    vi.mocked(getLifecareDocumentTypes).mockReset();
    vi.mocked(getLifecareDocumentTypes).mockResolvedValue({
      data: [
        { code: 1, name: 'EK Brev', canChangeOccurenceDate: true, protectedByDefault: false },
        { code: 4, name: 'EK Utredning', canChangeOccurenceDate: false, protectedByDefault: true },
      ],
    });
    vi.mocked(createLifecareDocument).mockReset();
  });

  it('writes the document with the Lifecare document type that was picked', async () => {
    vi.mocked(createLifecareDocument).mockResolvedValue({ data: null });
    const onCreated = vi.fn();
    render(<LifecareDocumentCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={onCreated} />);

    await fillIn('1');
    fireEvent.click(screen.getByRole('button', { name: 'Skapa' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
    });
    expect(createLifecareDocument).toHaveBeenCalledWith(
      'errand-1',
      expect.objectContaining({ documentTypeCode: 1, title: 'EK Brev', content: '<p>Hej</p>' })
    );
  });

  it('saves the document skrivskyddad when the handläggare ticks it', async () => {
    vi.mocked(createLifecareDocument).mockResolvedValue({ data: null });
    render(<LifecareDocumentCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={vi.fn()} />);

    await fillIn('1');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Spara skrivskyddad' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skapa' }));

    await waitFor(() => {
      expect(createLifecareDocument).toHaveBeenCalledWith('errand-1', expect.objectContaining({ protected: true }));
    });
  });

  it('has no time field, since a document carries none', async () => {
    render(<LifecareDocumentCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={vi.fn()} />);

    await fillIn('1');

    expect(screen.queryByLabelText('Tid')).not.toBeInTheDocument();
  });

  it('locks the date when the document type keeps the date Lifecare proposes', async () => {
    render(<LifecareDocumentCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={vi.fn()} />);

    await fillIn('4');

    expect(screen.getByLabelText('Datum *')).toBeDisabled();
  });

  it('keeps the text and shows the reason Lifecare gave when it refuses the document', async () => {
    vi.mocked(createLifecareDocument).mockResolvedValue({ error: 400, message: 'Dokumenttypen finns inte i Lifecare' });
    const onCreated = vi.fn();
    render(<LifecareDocumentCreateModal errandId="errand-1" onClose={vi.fn()} onCreated={onCreated} />);

    await fillIn('1');
    fireEvent.click(screen.getByRole('button', { name: 'Skapa' }));

    await waitFor(() => {
      expect(screen.getByText('Dokumenttypen finns inte i Lifecare')).toBeInTheDocument();
    });
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByLabelText('editor')).toHaveValue('Hej');
  });
});
