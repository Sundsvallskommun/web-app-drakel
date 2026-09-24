import { LifecareDecisionView } from '@data-contracts/backend/data-contracts';
import { useBeslutRecommendation } from '@hooks/use-beslut-recommendation';
import { useDecisionPhrases } from '@hooks/use-decision-phrases';
import { useDecisionProposal } from '@hooks/use-decision-proposal';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { useLifecareCalculation } from '@hooks/use-lifecare-calculation';
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
vi.mock('@hooks/use-lifecare-calculation', () => ({ useLifecareCalculation: vi.fn() }));
vi.mock('@hooks/use-decision-proposal', () => ({ useDecisionProposal: vi.fn() }));
vi.mock('@hooks/use-decision-phrases', () => ({ useDecisionPhrases: vi.fn() }));
vi.mock('@hooks/use-errand-stakeholders', () => ({ useErrandStakeholders: vi.fn() }));
vi.mock('@services/lifecare-decision-service', () => ({
  saveLifecareDecision: vi.fn(),
  getLifecareDecisionPdf: vi.fn(),
}));
vi.mock('@services/document-template-service', () => ({ getDocumentTemplateContent: vi.fn() }));
// The message editor is Quill behind next/dynamic; what is under test is the form around it.
// The mock shows the message it is handed, so a message filled in by the tab can be read.
vi.mock('./beslut-meddelande.component', () => ({
  BeslutMeddelande: ({ value }: { value: { markup?: string } }) => (
    <div data-testid="beslut-meddelande">{value.markup}</div>
  ),
}));

/** The beslutsformuleringar in Templating a bifall starts from. */
const PHRASES = [
  {
    identifier: 'drakel.fa.decision.bifall-manad',
    category: 'Ek bistånd Bifall MÅNAD PERIOD ÄNDAMÅL',
    name: 'Bifall månad',
  },
  {
    identifier: 'drakel.fa.decision.bifall-manad-barn',
    category: 'Ek bistånd Bifall MÅNAD PERIOD ÄNDAMÅL',
    name: 'Bifall månad MED BARN',
  },
];

const PHRASE_CONTENT: Record<string, string> = {
  'drakel.fa.decision.bifall-manad': '<p>Bifall till ¤ med ¥ kronor för ※.</p>',
  'drakel.fa.decision.bifall-manad-barn': '<p>Bifall med barn till ¤ med ¥ kronor för ※.</p>',
};

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

/** Lifecare's summering of the saved beräkning: a positive result is a normöverskott, a negative an underskott. */
const withResult = (result: number) => {
  vi.mocked(useLifecareCalculation).mockReturnValue({
    calculation: {
      id: 31,
      normName: 'Riksnorm 2026',
      date: '2026-09-24',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      finalized: true,
      updated: '2026-09-24',
      summary: {
        income: 0,
        jobStimulus: 0,
        jobStimulusDeduction: 0,
        norm: 5220,
        familyCost: 3940,
        commonHouseholdCost: 1280,
        expenses: 0,
        sum: result,
        specialExpenses: 0,
        result,
      },
    },
    isLoading: false,
    refresh: vi.fn(),
  });
};

/** careM's beslutsförslag — the only source of the outcome. */
const withProposedOutcome = (outcome: string) => {
  vi.mocked(useDecisionProposal).mockReturnValue({
    proposal: { outcome, reason: 'Föräldrapenning otillräcklig' },
    isLoading: false,
  });
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
    vi.mocked(useLifecareCalculation).mockReturnValue({ calculation: null, isLoading: false, refresh: vi.fn() });
    vi.mocked(saveLifecareDecision).mockReset();
    vi.mocked(getDocumentTemplateContent).mockClear();
    vi.mocked(getDocumentTemplateContent).mockImplementation((identifier) =>
      Promise.resolve({ data: PHRASE_CONTENT[identifier] ?? '<p>Fullföljdshänvisning</p>' })
    );
    vi.mocked(useDecisionPhrases).mockReturnValue({ phrases: PHRASES, isLoading: false });
    vi.mocked(useErrandStakeholders).mockReturnValue({
      stakeholders: [{ role: 'APPLICANT', firstName: 'Test', lastName: 'Testsson' }],
      isLoading: false,
      refresh: vi.fn(),
    });
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

  it('starts a new beslut from careM’s förslag, matched to Lifecare’s type and orsak', () => {
    withSaved(null);
    renderTab();

    expect(screen.getByLabelText('Beslut *')).toHaveValue('153');
    expect(screen.getByLabelText('Orsak')).toHaveValue('16');
  });

  it('preselects the avslag careM proposes, and shows no belopp on a normöverskott', () => {
    withSaved(null);
    withProposedOutcome('AVSLAG');
    withResult(1200);
    renderTab();

    expect(screen.getByLabelText('Beslut *')).toHaveValue('152');
    expect(screen.getByText('Förslag: Avslag')).toBeInTheDocument();
    expect(screen.queryByText('Belopp att bevilja')).not.toBeInTheDocument();
  });

  it('preselects 12 kap 1, 7 §§ bifall for careM’s delvis bifall, even with other bifall types offered', () => {
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
    withProposedOutcome('DELAVSLAG');
    withResult(-5220);
    renderTab();

    expect(screen.getByLabelText('Beslut *')).toHaveValue('153');
    expect(screen.getByText('Förslag: Delvis bifall')).toBeInTheDocument();
    expect(screen.getByText('Belopp att bevilja')).toBeInTheDocument();
  });

  it('starts a bifall with barn in the beräkning from "Bifall månad MED BARN", filled from the errand', async () => {
    vi.mocked(useErrandNormberakning).mockReturnValue({
      draft: {
        calculationFromDate: '2026-09-01',
        calculationToDate: '2026-09-30',
        persons: [
          { role: 'APPLICANT', included: true },
          { role: 'CHILD', included: true },
        ],
        expenses: [{ appliedAmount: 5000, effectiveAmount: 5000 }],
      },
      isLoading: false,
      refresh: vi.fn(),
    });
    withSaved(null);
    withResult(-5220);
    renderTab();

    await waitFor(() => {
      expect(screen.getByTestId('beslut-meddelande')).toHaveTextContent(
        /Bifall med barn till Test Testsson med 5\s220 kronor för september 2026\./
      );
    });
  });

  it('follows careM’s outcome, not its own reading of the normberäkning', () => {
    withSaved(null);
    withProposedOutcome('BIFALL');
    // An överskott by Lifecare's summering — careM still decides.
    withResult(1200);
    renderTab();

    expect(screen.getByLabelText('Beslut *')).toHaveValue('153');
  });

  it('starts a delvis bifall from the same beslutsformulering as a bifall', async () => {
    withSaved(null);
    withProposedOutcome('DELAVSLAG');
    withResult(-5220);
    renderTab();

    await waitFor(() => {
      expect(screen.getByTestId('beslut-meddelande')).toHaveTextContent(/Bifall till Test Testsson/);
    });
  });

  it('starts a bifall without barn from "Bifall månad"', async () => {
    withSaved(null);
    withResult(-5220);
    renderTab();

    await waitFor(() => {
      expect(screen.getByTestId('beslut-meddelande')).toHaveTextContent(/Bifall till Test Testsson/);
    });
  });

  it('leaves the message alone when the beslut is already saved, or the normberäkning is no bifall', () => {
    withSaved(SAVED);
    withResult(-5220);
    renderTab();
    expect(screen.getByTestId('beslut-meddelande')).toHaveTextContent('Beslut');
    expect(getDocumentTemplateContent).not.toHaveBeenCalledWith('drakel.fa.decision.bifall-manad');
  });

  it('lets Visa PDF show Lifecare’s print only of a saved, unchanged beslut', () => {
    withSaved(null);
    renderTab();

    expect(screen.getByRole('button', { name: 'Visa PDF' })).toBeDisabled();
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

  it('grants the underskott of the normberäkning saved in Lifecare, and shows it in red', () => {
    vi.mocked(useLifecareCalculation).mockReturnValue({
      calculation: {
        id: 31,
        date: '2026-09-24',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        finalized: false,
        updated: '2026-09-24',
        summary: {
          income: 0,
          jobStimulus: 0,
          jobStimulusDeduction: 0,
          norm: 5220,
          familyCost: 3940,
          commonHouseholdCost: 1280,
          expenses: 454,
          sum: -5674,
          specialExpenses: 0,
          result: -5674,
        },
      },
      isLoading: false,
      refresh: vi.fn(),
    });
    withSaved(null);
    renderTab();

    expect(screen.getByText('Normunderskott')).toBeInTheDocument();
    expect(screen.getByText('5674,00')).toBeInTheDocument();
  });

  it('offers nothing to save once Lifecare has locked the beslut', () => {
    withSaved({ ...SAVED, locked: true });
    const onRegisterSave = renderTab();

    expect(screen.getByText(/låst i Lifecare/)).toBeInTheDocument();
    expect(onRegisterSave).not.toHaveBeenCalledWith(expect.any(Function));
  });
});
