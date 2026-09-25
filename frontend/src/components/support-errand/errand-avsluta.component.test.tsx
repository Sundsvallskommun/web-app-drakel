import { getDigitalMailbox } from '@services/decision-notification-service';
import { finalizeErrand } from '@services/finalize-service';
import { getNormberakningDraft } from '@services/normberakning-service';
import { useUserStore } from '@services/user-service/user-service';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandAvsluta } from './errand-avsluta.component';

vi.mock('@services/decision-notification-service', () => ({ getDigitalMailbox: vi.fn() }));
vi.mock('@services/finalize-service', () => ({ finalizeErrand: vi.fn() }));
vi.mock('@services/normberakning-service', () => ({ getNormberakningDraft: vi.fn() }));

const finalized = {
  decisionId: 'decision-1',
  processMessageCorrelated: true,
  failedChannels: [],
};

const PROPOSED_MESSAGE = [
  'Hej,',
  'Din ansökan för september 2026 är klar. Se bifogade dokument.',
  'Test Handläggare',
  'Sundsvalls kommun',
  'Individ- och Arbetsmarknadsförvaltningen',
  'Enheten för ekonomiskt bistånd',
].join('\n');

const openModal = async ({ onFinalized = vi.fn() } = {}) => {
  render(<ErrandAvsluta errandId="errand-1" onFinalized={onFinalized} />);
  fireEvent.click(screen.getByRole('button', { name: 'Skicka beräkning och beslut' }));
  await waitFor(() => {
    expect(screen.getByLabelText('Meddelande')).toBeInTheDocument();
  });
};

const sendButton = (): HTMLElement => screen.getByRole('button', { name: 'Skicka' });
const attachmentList = (): HTMLElement => screen.getByRole('list');

describe('ErrandAvsluta', () => {
  beforeEach(() => {
    useUserStore.setState({ user: { ...useUserStore.getState().user, name: 'Test Handläggare' } });
    vi.mocked(getDigitalMailbox).mockReset();
    vi.mocked(getDigitalMailbox).mockResolvedValue({ data: false });
    vi.mocked(getNormberakningDraft).mockResolvedValue({ data: { applicationMonth: '2026-09' } });
    vi.mocked(finalizeErrand).mockReset();
    vi.mocked(finalizeErrand).mockResolvedValue({ data: finalized });
  });

  it('proposes the message for the ansökan’s month, signed by the handläggare, to Mina sidor and brev', async () => {
    await openModal();

    expect(screen.getByLabelText('Meddelande')).toHaveValue(PROPOSED_MESSAGE);
    expect(screen.getByLabelText('Mina sidor')).toBeChecked();
    expect(screen.getByLabelText('Brev')).toBeChecked();
    expect(screen.getByText('Du kan lägga till filer att skicka från Lifecare eller din dator')).toBeInTheDocument();
  });

  it('sends the beslut and the beräkning from Lifecare with it to begin with', async () => {
    await openModal();

    expect(within(attachmentList()).getByText('Beslut (Lifecare)')).toBeInTheDocument();
    expect(within(attachmentList()).getByText('Normberäkning (Lifecare)')).toBeInTheDocument();
  });

  it('says adding from Lifecare does not work in caremanagement yet', async () => {
    await openModal();

    expect(screen.getByRole('button', { name: 'Från Lifecare' })).toBeDisabled();
    expect(screen.getByText(/fungerar inte i caremanagement än/)).toBeInTheDocument();
  });

  it('sends the edited message with what the handläggare kept and added, through the channels left ticked', async () => {
    const onFinalized = vi.fn();
    const ownFile = new File(['%PDF-1.7'], 'hyresavi.pdf', { type: 'application/pdf' });
    await openModal({ onFinalized });

    fireEvent.change(screen.getByLabelText('Meddelande'), { target: { value: 'Hej, se bifogat.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ta bort Normberäkning (Lifecare)' }));
    fireEvent.change(screen.getByLabelText('Från datorn'), { target: { files: [ownFile] } });
    expect(within(attachmentList()).getByText('hyresavi.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Brev'));
    fireEvent.click(sendButton());

    await waitFor(() => {
      expect(onFinalized).toHaveBeenCalled();
    });
    expect(finalizeErrand).toHaveBeenCalledWith(
      'errand-1',
      {
        minaSidor: true,
        digitalBrevlada: false,
        brev: false,
        message: 'Hej, se bifogat.',
        includeDecision: true,
        includeCalculation: false,
      },
      [ownFile]
    );
  });

  it('lets the handläggare take out a file they added, and put back what they took out', async () => {
    const ownFile = new File(['%PDF-1.7'], 'hyresavi.pdf', { type: 'application/pdf' });
    await openModal();

    fireEvent.change(screen.getByLabelText('Från datorn'), { target: { files: [ownFile] } });
    fireEvent.click(screen.getByRole('button', { name: 'Ta bort hyresavi.pdf' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ta bort Beslut (Lifecare)' }));

    expect(within(attachmentList()).queryByText('hyresavi.pdf')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till beslutet' }));
    expect(within(attachmentList()).getByText('Beslut (Lifecare)')).toBeInTheDocument();
  });

  it('holds Skicka while the message is empty', async () => {
    await openModal();

    fireEvent.change(screen.getByLabelText('Meddelande'), { target: { value: '  ' } });

    expect(sendButton()).toBeDisabled();
    expect(screen.getByText('Skriv ett meddelande innan du skickar')).toBeInTheDocument();
  });

  it('keeps the dialog open with the reason when the finalize is refused', async () => {
    vi.mocked(finalizeErrand).mockResolvedValue({
      error: 400,
      message: 'Spara beslutet innan du beslutar och betalar ut.',
    });
    const onFinalized = vi.fn();
    await openModal({ onFinalized });

    fireEvent.click(sendButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Spara beslutet innan du beslutar och betalar ut.');
    expect(onFinalized).not.toHaveBeenCalled();
  });

  it('lists what did not go through before closing a finalized errand', async () => {
    vi.mocked(finalizeErrand).mockResolvedValue({ data: { ...finalized, failedChannels: ['Brev'] } });
    const onFinalized = vi.fn();
    await openModal({ onFinalized });

    fireEvent.click(sendButton());

    await waitFor(() => {
      expect(screen.getByText('Beslutet kunde inte skickas till: Brev.')).toBeInTheDocument();
    });
    expect(onFinalized).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Stäng' }));

    expect(onFinalized).toHaveBeenCalled();
  });
});
