import { DecisionProposal } from '@services/beslut-service';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BeslutProposalBox } from './beslut-proposal-box.component';

const FULL_PROPOSAL: DecisionProposal = {
  outcome: 'BIFALL',
  periodFrom: '2026-09-01',
  periodTo: '2026-09-30',
  estimatedAmount: 8450,
  normSum: 12000,
  incomeSum: 6000,
  expenseSum: 2000,
  specialExpenseSum: 450,
  previousDecision: {
    type: 'Försörjningsstöd',
    reason: 'Arbetslös, ingen ersättning/stöd',
    periodFrom: '2026-08-01',
    periodTo: '2026-08-31',
    amount: 7900,
  },
};

describe('BeslutProposalBox', () => {
  it('shows the parts the estimated amount is built from', () => {
    render(<BeslutProposalBox proposal={FULL_PROPOSAL} />);

    expect(screen.getByText('12000,00')).toBeInTheDocument();
    expect(screen.getByText('2000,00')).toBeInTheDocument();
    expect(screen.getByText('450,00')).toBeInTheDocument();
    // Incomes are subtracted, so they read as a negative part of the sum.
    expect(screen.getByText('−6000,00')).toBeInTheDocument();
    expect(screen.getByText('8450,00')).toBeInTheDocument();
  });

  it('shows the previous Lifecare decision', () => {
    render(<BeslutProposalBox proposal={FULL_PROPOSAL} />);

    expect(screen.getByText('Arbetslös, ingen ersättning/stöd')).toBeInTheDocument();
    expect(screen.getByText('2026-08-01 – 2026-08-31')).toBeInTheDocument();
    expect(screen.getByText('7900,00')).toBeInTheDocument();
  });

  it('says so when the applicant has no earlier decision', () => {
    render(<BeslutProposalBox proposal={{ estimatedAmount: 0 }} />);

    expect(screen.getByText('Inget tidigare Lifecare-beslut hittades för den sökande.')).toBeInTheDocument();
  });

  it('explains why the proposal is incomplete and shows its warnings with the API label', () => {
    render(
      <BeslutProposalBox
        proposal={{
          explanation: 'Ingen norm kunde läsas från Lifecare.',
          warnings: [
            {
              id: 'w1',
              type: 'PREVIOUS_DECISION_ADVANCE_ON_BENEFIT',
              typeDisplayName: 'Förskott på förmån',
              message: 'Föregående beslut var förskott på förmån.',
              status: 'OPEN',
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Ingen norm kunde läsas från Lifecare.')).toBeInTheDocument();
    expect(screen.getByText('Förskott på förmån')).toBeInTheDocument();
    expect(screen.getByText('Föregående beslut var förskott på förmån.')).toBeInTheDocument();
  });

  it('hides acknowledged warnings', () => {
    render(
      <BeslutProposalBox
        proposal={{
          estimatedAmount: 100,
          warnings: [{ id: 'w1', typeDisplayName: 'Kvitterad varning', status: 'ACKNOWLEDGED' }],
        }}
      />
    );

    expect(screen.queryByText('Kvitterad varning')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no proposal to show', () => {
    const { container } = render(<BeslutProposalBox proposal={{}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
