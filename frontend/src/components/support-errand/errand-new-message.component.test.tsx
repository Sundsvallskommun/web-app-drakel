import { postErrandMessage } from '@services/errand-service/errand-service';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FC } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandNewMessage } from './errand-new-message.component';

vi.mock('@services/errand-service/errand-service', () => ({
  downloadMessageAttachment: vi.fn(),
  postErrandMessage: vi.fn(),
}));

// Quill can't run in jsdom: stand in for the dynamically imported rich-text editor with a textarea that reports
// its text as both plain text and paragraph markup, like the real editor.
const FakeMessageEditor: FC<{ onChange: (value: TextEditorValue) => void }> = ({ onChange }) => (
  <textarea
    aria-label="Nytt meddelande"
    onChange={(event) => {
      onChange({ plainText: event.target.value, markup: `<p>${event.target.value}</p>` });
    }}
  />
);
// vi.mock is hoisted above FakeMessageEditor's definition, so resolve it lazily at render time.
vi.mock('next/dynamic', () => ({
  default: () => (props: { onChange: (value: TextEditorValue) => void }) => <FakeMessageEditor {...props} />,
}));

describe('ErrandNewMessage', () => {
  beforeEach(() => {
    vi.mocked(postErrandMessage).mockReset();
    vi.mocked(postErrandMessage).mockResolvedValue({ data: null });
  });

  it('keeps earlier attachments when files are selected in multiple rounds and sends the body as HTML', async () => {
    const onSent = vi.fn();
    render(<ErrandNewMessage errandId="errand-1" onCancelReply={vi.fn()} onSent={onSent} />);

    const firstFile = new File(['first'], 'first.pdf', { type: 'application/pdf' });
    const secondFile = new File(['second'], 'second.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText('Välj fil att lägga till');

    fireEvent.change(fileInput, { target: { files: [firstFile] } });
    fireEvent.change(fileInput, { target: { files: [secondFile] } });
    fireEvent.change(screen.getByLabelText('Nytt meddelande'), { target: { value: 'Hej' } });
    fireEvent.click(screen.getByRole('button', { name: 'Skicka' }));

    expect(screen.getByText('first.pdf')).toBeInTheDocument();
    expect(screen.getByText('second.pdf')).toBeInTheDocument();
    await waitFor(() => {
      expect(postErrandMessage).toHaveBeenCalledWith('errand-1', '<p>Hej</p>', [firstFile, secondFile], undefined);
    });
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('does not send a message without text', async () => {
    render(<ErrandNewMessage errandId="errand-1" onCancelReply={vi.fn()} onSent={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Skicka' }));

    expect(await screen.findByText('Skriv ett meddelande')).toBeInTheDocument();
    expect(postErrandMessage).not.toHaveBeenCalled();
  });
});
