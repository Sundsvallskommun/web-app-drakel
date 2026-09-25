import { finalizeErrand } from '@services/finalize-service';
import { getNormberakningDraft } from '@services/normberakning-service';
import { useUserStore } from '@services/user-service/user-service';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandAvsluta } from './errand-avsluta.component';

vi.mock('@services/finalize-service', () => ({ finalizeErrand: vi.fn() }));
vi.mock('@services/normberakning-service', () => ({ getNormberakningDraft: vi.fn() }));
// Quill can't run in jsdom: stand in for the rich text editor with a textarea that shows the plain text it is handed
// and reports what is typed as both plain text and paragraph markup, like the real editor.
vi.mock('@components/common/text-editor.component', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: TextEditorValue;
    onChange: (event: { target: { value: TextEditorValue } }) => void;
  }) => (
    <textarea
      aria-label="Meddelandetext"
      value={value.plainText}
      onChange={(event) => {
        onChange({ target: { value: { plainText: event.target.value, markup: `<p>${event.target.value}</p>` } } });
      }}
    />
  ),
}));

const finalized = {
  decisionId: 'decision-1',
  processMessageCorrelated: true,
  failedChannels: [],
};

const openModal = async ({ onFinalized = vi.fn() } = {}) => {
  render(<ErrandAvsluta errandId="errand-1" onFinalized={onFinalized} />);
  fireEvent.click(screen.getByRole('button', { name: 'Skicka beräkning och beslut' }));
  await waitFor(() => {
    expect(screen.getByLabelText('Meddelandetext')).toBeInTheDocument();
  });
};

const sendButton = (): HTMLElement => screen.getByRole('button', { name: 'Skicka' });
const attachmentList = (): HTMLElement => screen.getByRole('list');

describe('ErrandAvsluta', () => {
  beforeEach(() => {
    useUserStore.setState({ user: { ...useUserStore.getState().user, name: 'Test Handläggare' } });
    vi.mocked(getNormberakningDraft).mockResolvedValue({ data: { applicationMonth: '2026-10' } });
    vi.mocked(finalizeErrand).mockReset();
    vi.mocked(finalizeErrand).mockResolvedValue({ data: finalized });
  });

  it('proposes the message for the ansökan’s month, signed by the handläggare, to Mina sidor and as a meddelande', async () => {
    await openModal();

    expect(screen.getByLabelText('Meddelandetext')).toHaveValue(
      [
        'Hej,',
        '',
        'Din ansökan för oktober 2026 är klar. Se bifogade dokument.',
        '',
        'Test Handläggare',
        'Individ- och Arbetsmarknadsförvaltningen',
        'Enheten för ekonomiskt bistånd',
      ].join('\n')
    );
    expect(screen.getByRole('checkbox', { name: 'Mina sidor' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Meddelande' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Brev' })).not.toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'Digital brevlåda' })).not.toBeInTheDocument();
    expect(screen.getByText(/Mina sidor fungerar inte än/)).toBeInTheDocument();
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

  it('sends the edited message as markup with what the handläggare kept and added, through the channels ticked', async () => {
    const onFinalized = vi.fn();
    const ownFile = new File(['%PDF-1.7'], 'hyresavi.pdf', { type: 'application/pdf' });
    await openModal({ onFinalized });

    fireEvent.change(screen.getByLabelText('Meddelandetext'), { target: { value: 'Hej, se bifogat.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ta bort Normberäkning (Lifecare)' }));
    fireEvent.change(screen.getByLabelText('Från datorn'), { target: { files: [ownFile] } });
    expect(within(attachmentList()).getByText('hyresavi.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Brev' }));
    fireEvent.click(sendButton());

    await waitFor(() => {
      expect(onFinalized).toHaveBeenCalled();
    });
    expect(finalizeErrand).toHaveBeenCalledWith(
      'errand-1',
      {
        minaSidor: true,
        meddelande: true,
        brev: true,
        message: '<p>Hej, se bifogat.</p>',
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

    fireEvent.change(screen.getByLabelText('Meddelandetext'), { target: { value: '  ' } });

    expect(sendButton()).toBeDisabled();
    expect(screen.getByText('Skriv ett meddelande innan du skickar')).toBeInTheDocument();
  });

  it('holds Skicka when only Mina sidor is left, since nothing is sent there yet', async () => {
    await openModal();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Meddelande' }));

    expect(sendButton()).toBeDisabled();
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
    vi.mocked(finalizeErrand).mockResolvedValue({ data: { ...finalized, failedChannels: ['Meddelande'] } });
    const onFinalized = vi.fn();
    await openModal({ onFinalized });

    fireEvent.click(sendButton());

    await waitFor(() => {
      expect(screen.getByText('Beslutet kunde inte skickas till: Meddelande.')).toBeInTheDocument();
    });
    expect(onFinalized).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Stäng' }));

    expect(onFinalized).toHaveBeenCalled();
  });
});
