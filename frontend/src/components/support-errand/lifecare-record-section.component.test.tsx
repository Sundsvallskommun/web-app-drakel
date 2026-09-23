import { getLifecareRecordBodies, getLifecareRecords, LifecareRecord } from '@services/lifecare-documents-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LifecareRecordSection } from './lifecare-record-section.component';

vi.mock('@services/lifecare-documents-service', () => ({
  getLifecareRecords: vi.fn(),
  getLifecareRecordBodies: vi.fn(),
}));

const note = (id: string, title: string): LifecareRecord => ({
  id,
  category: 'JOURNAL_NOTE',
  title,
  dateTime: `2026-09-2${id}T10:00`,
  type: 'Journalanteckning',
  ownerTypeText: 'EK Ekonomiskt bistånd',
  modifiedBy: 'RPA_031DEV 2026-09-23',
  locked: false,
  protected: false,
});

describe('LifecareRecordSection', () => {
  beforeEach(() => {
    vi.mocked(getLifecareRecords).mockReset();
    vi.mocked(getLifecareRecords).mockResolvedValue({
      data: {
        journalNotes: [note('1', 'Telefonsamtal'), note('2', 'Hembesök'), note('3', 'Inkommen handling')],
        documents: [],
      },
    });
    vi.mocked(getLifecareRecordBodies).mockReset();
    vi.mocked(getLifecareRecordBodies).mockResolvedValue({
      data: [
        { id: '1', content: '<p>Sökande ringde om hyran för maj.</p>' },
        { id: '2', content: '<p>Besök i hemmet.</p>' },
        { id: '3' },
      ],
    });
  });

  it('shows the text of every record without opening it', async () => {
    render(<LifecareRecordSection errandId="errand-1" category="JOURNAL_NOTE" />);

    await waitFor(() => {
      expect(screen.getByText('Sökande ringde om hyran för maj.')).toBeInTheDocument();
    });
    expect(screen.getByText('Besök i hemmet.')).toBeInTheDocument();
    // Lifecare would not hand over the third one; the card says so rather than looking empty.
    expect(screen.getByText(/Texten kunde inte hämtas från Lifecare/)).toBeInTheDocument();
  });

  it('narrows the list to the records matching the search, text included', async () => {
    render(<LifecareRecordSection errandId="errand-1" category="JOURNAL_NOTE" />);
    await waitFor(() => {
      expect(screen.getByText('Sökande ringde om hyran för maj.')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Sök bland journalanteckningarna'), {
      target: { value: 'hyran' },
    });

    expect(screen.getByText('Telefonsamtal')).toBeInTheDocument();
    expect(screen.queryByText('Hembesök')).not.toBeInTheDocument();
    expect(screen.queryByText('Inkommen handling')).not.toBeInTheDocument();
    // Searching happens in the browser; nothing more is asked of the BFF.
    expect(getLifecareRecords).toHaveBeenCalledTimes(1);
    expect(getLifecareRecordBodies).toHaveBeenCalledTimes(1);
  });

  it('says so when nothing matches the search', async () => {
    render(<LifecareRecordSection errandId="errand-1" category="JOURNAL_NOTE" />);
    await waitFor(() => {
      expect(screen.getByText('Telefonsamtal')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Sök bland journalanteckningarna'), {
      target: { value: 'finns inte' },
    });

    expect(screen.getByText('Inget matchar sökningen.')).toBeInTheDocument();
  });
});
