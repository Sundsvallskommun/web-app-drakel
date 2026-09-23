import { LifecareDecisionView } from '@data-contracts/backend/data-contracts';
import { useBeslutRecommendation } from '@hooks/use-beslut-recommendation';
import { useDecisionProposal } from '@hooks/use-decision-proposal';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { useLifecareDecision } from '@hooks/use-lifecare-decision';
import { useLifecareDecisionReasons } from '@hooks/use-lifecare-decision-reasons';
import { useLifecareDecisionTypes } from '@hooks/use-lifecare-decision-types';
import { getDocumentTemplateContent } from '@services/document-template-service';
import { saveLifecareDecision } from '@services/lifecare-decision-service';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrandBeslut } from './errand-beslut.component';

vi.mock('@hooks/use-errand-normberakning', () => ({ useErrandNormberakning: vi.fn() }));
vi.mock('@hooks/use-beslut-recommendation', () => ({ useBeslutRecommendation: vi.fn() }));
vi.mock('@hooks/use-lifecare-decision-types', () => ({ useLifecareDecisionTypes: vi.fn() }));
vi.mock('@hooks/use-lifecare-decision-reasons', () => ({ useLifecareDecisionReasons: vi.fn() }));
vi.mock('@hooks/use-lifecare-decision', () => ({ useLifecareDecision: vi.fn() }));
vi.mock('@hooks/use-decision-proposal', () => ({ useDecisionProposal: vi.fn() }));
vi.mock('@services/lifecare-decision-service', () => ({
  saveLifecareDecision: vi.fn(),
  getLifecareDecisionPdf: vi.fn(),
}));
vi.mock('@services/document-template-service', () => ({ getDocumentTemplateContent: vi.fn() }));
// The message editor is Quill behind next/dynamic; what is under test is the form around it.
vi.mock('./beslut-meddelande.component', () => ({ BeslutMeddelande: () => null }));

// Lifecare's beslutstyper for the insats; återkrav is offered but not registered from Drakel.
const TYPES = [
  {
    code: 152,
    name: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag',
    outcome: 'AVSLAG',
    requiresFromDate: false,
    requiresToDate: false,
  },
  {
    code: 153,
    name: 'Ek Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, bifall',
    outcome: 'BIFALL',
    requiresFromDate: true,
    requiresToDate: true,
  },
  { code: 161, name: 'EK Återkrav Ekonomiskt bistånd, grundbeslut', requiresFromDate: false, requiresToDate: false },
];

// Lifecare's orsaker for bifall, under their headings.
const REASONS = [
  { code: 1, name: 'Arbetslös, otillräcklig ersättning/stöd', header: 'Arbetslös' },
  { code: 16, name: 'Föräldrapenning otillräcklig', header: 'Föräldraledig' },
  { code: 17, name: 'Föräldrapenning, väntar på', header: 'Föräldraledig' },
];

/** The beslut as it stands in Lifecare. */
const SAVED: LifecareDecisionView = {
  id: 98,
  decisionCode: 153,
  outcome: 'BIFALL',
  date: '2026-09-23',
  periodFrom: '2026-09-01',
  periodTo: '2026-09-30',
  amount: 3000,
  reasonCode: 1,
  reason: 'Arbetslös, otillräcklig ersättning/stöd',
  message: '<p>Beslut</p>',
  locked: false,
  decisionMaker: 'Test Handläggare',
};

const withSaved = (decision: LifecareDecisionView | null) => {
  vi.mocked(useLifecareDecision).mockReturnValue({ decision, isLoading: false, refresh: vi.fn() });
};

/** Renders the tab and hands back the save it registers with the central "Spara ärende" button. */
const renderTab = () => {
  const onRegisterSave = vi.fn();
  render(<ErrandBeslut errandId="errand-1" onRegisterSave={onRegisterSave} />);
  return onRegisterSave;
};

describe('ErrandBeslut', () => {
  beforeEach(() => {
    vi.mocked(useErrandNormberakning).mockReturnValue({ draft: undefined, isLoading: false, refresh: vi.fn() });
    vi.mocked(useBeslutRecommendation).mockReturnValue({ recommendation: null, isLoading: false });
    vi.mocked(useLifecareDecisionTypes).mockReturnValue({ types: TYPES, isLoading: false });
    vi.mocked(useLifecareDecisionReasons).mockReturnValue({ reasons: REASONS, isLoading: false });
    vi.mocked(useDecisionProposal).mockReturnValue({
      proposal: {
        outcome: 'BIFALL',
        reason: 'Föräldrapenning otillräcklig',
      },
      isLoading: false,
    });
    vi.mocked(saveLifecareDecision).mockReset();
    vi.mocked(getDocumentTemplateContent).mockResolvedValue({ data: '<p>Fullföljdshänvisning</p>' });
  });

  it('reads the form back from the beslut saved in Lifecare', () => {
    withSaved(SAVED);
    renderTab();

    expect(screen.getByLabelText('Beslut *')).toHaveValue('153');
    expect(screen.getByLabelText('Från')).toHaveValue('2026-09-01');
    expect(screen.getByLabelText('Orsak')).toHaveValue('1');
  });

  it('offers Lifecare’s beslutstyper, and its orsaker under their headings', () => {
    withSaved(SAVED);
    renderTab();

    expect(screen.getByRole('option', { name: 'EK Återkrav Ekonomiskt bistånd, grundbeslut' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Föräldraledig' })).toHaveTextContent(
      'Föräldrapenning otillräckligFöräldrapenning, väntar på'
    );
  });

  it('leaves the beslutstyp to the handläggare when Lifecare has several for the proposed outcome', () => {
    vi.mocked(useLifecareDecisionTypes).mockReturnValue({
      types: [
        ...TYPES,
        {
          code: 150,
          name: 'EK Ekonomiskt bistånd 12 Kap 2 § SoL, bifall',
          outcome: 'BIFALL',
          requiresFromDate: true,
          requiresToDate: true,
        },
      ],
      isLoading: false,
    });
    withSaved(null);
    renderTab();

    expect(screen.getByLabelText('Beslut *')).toHaveValue('');
  });

  it('starts a new beslut from careM’s förslag, matched to Lifecare’s type and orsak', () => {
    withSaved(null);
    renderTab();

    expect(screen.getByLabelText('Beslut *')).toHaveValue('153');
    expect(screen.getByLabelText('Orsak')).toHaveValue('16');
  });

  it('lets the preview show Lifecare’s print only of a saved, unchanged beslut', () => {
    withSaved(null);
    renderTab();

    expect(screen.getByRole('button', { name: 'Förhandsgranska' })).toBeDisabled();
    expect(screen.getByText(/Spara för att se dina ändringar/)).toBeInTheDocument();
  });

  it('saves the beslut to Lifecare, the orsak included', async () => {
    withSaved(null);
    vi.mocked(saveLifecareDecision).mockResolvedValue({ data: SAVED });
    const onRegisterSave = renderTab();

    // A fresh beslut starts from the beslutsförslag, so there is something to save straight away.
    await waitFor(() => {
      expect(onRegisterSave).toHaveBeenLastCalledWith(expect.any(Function));
    });
    const save = onRegisterSave.mock.lastCall?.[0] as () => Promise<boolean>;
    let saved = false;
    await act(async () => {
      saved = await save();
    });

    expect(saved).toBe(true);
    expect(saveLifecareDecision).toHaveBeenCalledWith(
      'errand-1',
      expect.objectContaining({
        decisionCode: 153,
        reasonCode: 16,
        decisionMessage: '<p>Fullföljdshänvisning</p>',
      })
    );
  });

  it('shows why Lifecare or Drakel would not save the beslut', async () => {
    withSaved(null);
    vi.mocked(saveLifecareDecision).mockResolvedValue({
      error: 422,
      message: 'Delvis bifall kan inte registreras i Lifecare från Drakel ännu.',
    });
    const onRegisterSave = renderTab();
    await waitFor(() => {
      expect(onRegisterSave).toHaveBeenLastCalledWith(expect.any(Function));
    });
    const save = onRegisterSave.mock.lastCall?.[0] as () => Promise<boolean>;

    await act(async () => {
      await save();
    });

    expect(screen.getByText('Delvis bifall kan inte registreras i Lifecare från Drakel ännu.')).toBeInTheDocument();
  });

  it('offers nothing to save once Lifecare has locked the beslut', () => {
    withSaved({ ...SAVED, locked: true });
    const onRegisterSave = renderTab();

    expect(screen.getByText(/låst i Lifecare/)).toBeInTheDocument();
    expect(onRegisterSave).not.toHaveBeenCalledWith(expect.any(Function));
  });
});
