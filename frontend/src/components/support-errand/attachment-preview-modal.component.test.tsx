import { getUnifiedAttachmentBlob } from '@services/errand-service/errand-service';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AttachmentPreviewModal } from './attachment-preview-modal.component';

vi.mock('@services/errand-service/errand-service', () => ({ getUnifiedAttachmentBlob: vi.fn() }));
// The rich .docx renderer is not what is under test here.
vi.mock('docx-preview', () => ({ renderAsync: vi.fn() }));

const PDF_URL = 'blob:http://localhost/meddelandebilaga';

describe('AttachmentPreviewModal', () => {
  beforeEach(() => {
    vi.mocked(getUnifiedAttachmentBlob).mockResolvedValue(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));
    // jsdom has no object URLs.
    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => PDF_URL), configurable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a message attachment PDF trimmed down, as the sammanställning, and opens it in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(
      <AttachmentPreviewModal
        errandId="errand-1"
        attachment={{ id: 'attachment-1', fileName: 'intyg.pdf', mimeType: 'application/pdf' }}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Öppna bilaga i ny flik' }));

    expect(screen.getByTitle('intyg.pdf')).toHaveAttribute(
      'src',
      `${PDF_URL}#pagemode=none&toolbar=0&navpanes=0&view=FitH`
    );
    expect(open).toHaveBeenCalledWith(PDF_URL, '_blank', 'noopener,noreferrer');
  });
});
