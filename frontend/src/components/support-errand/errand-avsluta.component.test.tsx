import { getDigitalMailbox, sendDecisionNotification } from '@services/decision-notification-service';
import { updateErrand } from '@services/errand-service/errand-service';
import { getSectionApprovals } from '@services/section-approval-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandAvsluta } from './errand-avsluta.component';

// The rich-text editor is stubbed out: it loads Quill through next/dynamic, and waiting for that made
// the first run of these tests time out. What is under test is the modal around it, not the editor.
vi.mock('@components/common/text-editor.component', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="text-editor" />,
}));

vi.mock('@services/decision-notification-service', () => ({
  getDigitalMailbox: vi.fn(),
  sendDecisionNotification: vi.fn(),
}));
vi.mock('@services/errand-service/errand-service', () => ({ updateErrand: vi.fn() }));
vi.mock('@services/section-approval-service', () => ({ getSectionApprovals: vi.fn() }));

const openModal = async () => {
  render(<ErrandAvsluta errandId="errand-1" onClosed={vi.fn()} checkApprovals={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Besluta och utbetala' }));
  await waitFor(() => {
    expect(screen.getByLabelText('Meddelande')).toBeInTheDocument();
  });
};

/** The confirm button inside the modal — the one that opened it carries the same label. */
const confirmButton = (): HTMLElement => {
  const [, confirm] = screen.getAllByRole('button', { name: 'Besluta och utbetala' });
  if (!confirm) {
    throw new Error('the modal did not render its confirm button');
  }
  return confirm;
};

describe('ErrandAvsluta', () => {
  beforeEach(() => {
    vi.mocked(getDigitalMailbox).mockReset();
    vi.mocked(getDigitalMailbox).mockResolvedValue({ data: false });
    vi.mocked(getSectionApprovals).mockReset();
    vi.mocked(getSectionApprovals).mockResolvedValue({ data: {} });
    vi.mocked(sendDecisionNotification).mockReset();
    vi.mocked(sendDecisionNotification).mockResolvedValue({ data: [] });
    vi.mocked(updateErrand).mockReset();
    vi.mocked(updateErrand).mockResolvedValue({});
  });

  it('offers the message channel alongside the others, unticked', async () => {
    // The other channels send the beslut that already exists; this one sends something the handläggare
    // has to write, so it must not start ticked.
    await openModal();

    expect(screen.getByLabelText('Mina sidor')).toBeChecked();
    expect(screen.getByLabelText('Brev')).toBeChecked();
    expect(screen.getByLabelText('Meddelande')).not.toBeChecked();
  });

  it('shows the editor only once the message channel is picked', async () => {
    await openModal();

    expect(screen.queryByTestId('text-editor')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Meddelande'));

    await waitFor(() => {
      expect(screen.getByTestId('text-editor')).toBeInTheDocument();
    });
    expect(screen.getByText('Meddelande till sökande')).toBeInTheDocument();
  });

  it('holds the confirm button while the picked message channel has nothing written', async () => {
    await openModal();
    expect(confirmButton()).toBeEnabled();

    fireEvent.click(screen.getByLabelText('Meddelande'));

    await waitFor(() => {
      expect(confirmButton()).toBeDisabled();
    });
    expect(screen.getByText('Skriv ett meddelande innan du beslutar')).toBeInTheDocument();
  });

  it('sends the beslut through the channels that were left ticked', async () => {
    await openModal();

    fireEvent.click(screen.getByLabelText('Brev'));
    fireEvent.click(confirmButton());

    await waitFor(() => {
      expect(sendDecisionNotification).toHaveBeenCalledWith('errand-1', {
        minaSidor: true,
        digitalBrevlada: false,
        brev: false,
      });
    });
  });
});
