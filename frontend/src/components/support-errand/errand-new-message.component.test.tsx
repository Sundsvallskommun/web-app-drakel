import { postErrandMessage } from '@services/errand-service/errand-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandNewMessage } from './errand-new-message.component';

vi.mock('@services/errand-service/errand-service', () => ({
  downloadMessageAttachment: vi.fn(),
  postErrandMessage: vi.fn(),
}));

describe('ErrandNewMessage', () => {
  beforeEach(() => {
    vi.mocked(postErrandMessage).mockReset();
    vi.mocked(postErrandMessage).mockResolvedValue({ data: null });
  });

  it('keeps earlier attachments when files are selected in multiple rounds', async () => {
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
      expect(postErrandMessage).toHaveBeenCalledWith('errand-1', 'Hej', [firstFile, secondFile], undefined);
    });
    expect(onSent).toHaveBeenCalledTimes(1);
  });
});
