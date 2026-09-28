import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PdfModalButton } from './pdf-modal-button.component';

const PDF_URL = 'blob:http://localhost/berakning';

// jsdom has no object URLs.
const createObjectURL = vi.fn((_blob: Blob) => PDF_URL);
const revokeObjectURL = vi.fn();

describe('PdfModalButton', () => {
  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    Object.defineProperty(window.URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the PDF on click and shows it as a PDF, whatever type it came as', async () => {
    const loadPdf = vi.fn(() => Promise.resolve({ data: new Blob(['<script>'], { type: 'text/html' }) }));
    render(<PdfModalButton loadPdf={loadPdf} modalLabel="Beräkning" />);
    expect(loadPdf).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Förhandsgranska PDF' }));

    expect(await screen.findByTitle('Beräkning')).toHaveAttribute(
      'src',
      `${PDF_URL}#pagemode=none&toolbar=0&navpanes=0&view=FitH`
    );
    const shownBlob = createObjectURL.mock.calls[0]?.[0];
    expect(shownBlob?.type).toBe('application/pdf');
  });

  it('shows a base64 PDF from the print endpoints', async () => {
    render(<PdfModalButton loadPdf={() => Promise.resolve({ data: btoa('%PDF-1.7') })} modalLabel="Beslut" />);

    fireEvent.click(screen.getByRole('button', { name: 'Förhandsgranska PDF' }));

    expect(await screen.findByTitle('Beslut')).toBeInTheDocument();
  });

  it('revokes the object URL when the modal closes', async () => {
    render(<PdfModalButton loadPdf={() => Promise.resolve({ data: btoa('%PDF-1.7') })} modalLabel="Beslut" />);
    fireEvent.click(screen.getByRole('button', { name: 'Förhandsgranska PDF' }));
    await screen.findByTitle('Beslut');

    fireEvent.click(screen.getByRole('button', { name: /stäng|close/i }));

    expect(revokeObjectURL).toHaveBeenCalledWith(PDF_URL);
  });

  it('shows why the PDF could not be made', async () => {
    render(
      <PdfModalButton
        loadPdf={() => Promise.resolve({ error: 502, message: 'Lifecare svarade inte' })}
        modalLabel="Beslut"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Förhandsgranska PDF' }));

    expect(await screen.findByText('Lifecare svarade inte')).toBeInTheDocument();
  });
});
