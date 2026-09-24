'use client';

import { DecisionProposal } from '@services/beslut-service';
import { Alert } from '@sk-web-gui/alert';
import { displayAmount } from '@utils/format-amount';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentBox } from './content-box.component';
import { LabeledValue } from './labeled-value.component';

/** The applicant's most recent Lifecare decision, for comparison against what is being decided now. */
const PreviousDecisionSummary: FC<{ proposal: DecisionProposal }> = ({ proposal }) => {
  const { t } = useTranslation('decision');
  const previous = proposal.previousDecision;

  if (!previous) {
    return <p className="m-0 text-dark-secondary">{t('proposal.noPreviousDecision')}</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-24">
      <LabeledValue label={t('proposal.previousType')}>{previous.type ?? '—'}</LabeledValue>
      <LabeledValue label={t('proposal.previousReason')}>{previous.reason ?? '—'}</LabeledValue>
      <LabeledValue label={t('proposal.previousPeriod')}>
        {[previous.periodFrom, previous.periodTo].filter(Boolean).join(' – ') || '—'}
      </LabeledValue>
      <LabeledValue label={t('proposal.previousAmount')}>
        <span className="tabular-nums">{displayAmount(previous.amount)}</span>
      </LabeledValue>
    </div>
  );
};

/**
 * The beslutsförslag shown above the Nytt beslut form: why the proposal is incomplete when it is, the
 * DECISION-section warnings it raised, and the previous Lifecare decision. The normberäkning's result is
 * shown with the Beslutsuppgifter instead.
 *
 * Read-only throughout. The proposal's orsak and frastext are inputs to "Besluta och utbetala"
 * (finalize), not to the decision the form saves, so they are deliberately not editable here.
 */
export const BeslutProposalBox: FC<{ proposal: DecisionProposal }> = ({ proposal }) => {
  const { t } = useTranslation('decision');
  const openWarnings = (proposal.warnings ?? []).filter((warning) => warning.status === 'OPEN');
  if (!proposal.explanation && openWarnings.length === 0 && !proposal.previousDecision) {
    return null;
  }

  return (
    <ContentBox title={t('proposal.title')}>
      {proposal.explanation ?
        <p className="m-0 text-dark-secondary">{proposal.explanation}</p>
      : null}

      {openWarnings.map((warning, index) => (
        <Alert key={warning.id ?? index} type="warning">
          <Alert.Icon />
          <Alert.Content>
            {/* caremanagement's own Swedish label — no local translation table. */}
            <Alert.Content.Title className="font-bold">{warning.typeDisplayName ?? warning.type}</Alert.Content.Title>
            {warning.message ?
              <Alert.Content.Description>{warning.message}</Alert.Content.Description>
            : null}
          </Alert.Content>
        </Alert>
      ))}

      <div className="flex flex-col gap-16">
        <h4 className="text-base font-bold m-0">{t('proposal.previousTitle')}</h4>
        <PreviousDecisionSummary proposal={proposal} />
      </div>
    </ContentBox>
  );
};
