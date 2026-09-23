import { getDigitalMailbox } from '@services/decision-notification-service';
import { finalizeErrand } from '@services/finalize-service';
import { getSectionApprovals } from '@services/section-approval-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandAvsluta } from './errand-avsluta.component';

// The rich-text editor is stubbed out: it loads Quill through next/dynamic, and waiting for that made
// the first run of these tests time out. What is under test is the modal around it, not the editor.
vi.mock('@components/common/text-editor.component', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="text-editor" />,
}));

vi.mock('@services/decision-notification-service', () => ({ getDigitalMailbox: vi.fn() }));
vi.mock('@services/finalize-service', () => ({ finalizeErrand: vi.fn() }));
vi.mock('@services/section-approval-service', () => ({ getSectionApprovals: vi.fn() }));

const finalized = {
  decisionId: 'decision-1',
  paymentIds: ['payment-1'],
  payeeWarnings: [],
  failedRpaTasks: [],
  processMessageCorrelated: true,
  failedChannels: [],
};

const openModal = async ({ onFinalized = vi.fn(), checkApprovals = false } = {}) => {
  render(
    <ErrandAvsluta errandId="errand-1" onFinalized={onFinalized} checkApprovals={checkApprovals} reason="Arbetslös" />
  );
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
    vi.mocked(finalizeErrand).mockReset();
    vi.mocked(finalizeErrand).mockResolvedValue({ data: finalized });
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

  it('finalizes with the orsak and the channels that were left ticked', async () => {
    const onFinalized = vi.fn();
    await openModal({ onFinalized });

    fireEvent.click(screen.getByLabelText('Brev'));
    fireEvent.click(confirmButton());

    await waitFor(() => {
      expect(onFinalized).toHaveBeenCalled();
    });
    expect(finalizeErrand).toHaveBeenCalledWith('errand-1', {
      minaSidor: true,
      digitalBrevlada: false,
      brev: false,
      reason: 'Arbetslös',
    });
  });

  it('holds the confirm button until every section is approved', async () => {
    // caremanagement refuses a finalize with an unapproved section, so offering the button would only fail.
    vi.mocked(getSectionApprovals).mockResolvedValue({
      data: { calculation: { approved: true }, payment: { approved: false }, decision: { approved: true } },
    });
    await openModal({ checkApprovals: true });

    expect(confirmButton()).toBeDisabled();
    expect(screen.getByText('Utbetalning')).toBeInTheDocument();
  });

  it('keeps the dialog open with the reason when the finalize is refused', async () => {
    vi.mocked(finalizeErrand).mockResolvedValue({ error: 409, message: 'The errand has already been finalized' });
    const onFinalized = vi.fn();
    await openModal({ onFinalized });

    fireEvent.click(confirmButton());

    await waitFor(() => {
      expect(screen.getByText('The errand has already been finalized')).toBeInTheDocument();
    });
    expect(onFinalized).not.toHaveBeenCalled();
  });

  it('lists what did not go through before closing a finalized errand', async () => {
    vi.mocked(finalizeErrand).mockResolvedValue({ data: { ...finalized, failedChannels: ['Brev'] } });
    const onFinalized = vi.fn();
    await openModal({ onFinalized });

    fireEvent.click(confirmButton());

    await waitFor(() => {
      expect(screen.getByText('Beslutet kunde inte skickas till: Brev.')).toBeInTheDocument();
    });
    expect(onFinalized).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Stäng' }));

    expect(onFinalized).toHaveBeenCalled();
  });
});
