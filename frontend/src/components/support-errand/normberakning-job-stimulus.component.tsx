'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { useErrandJobStimulus } from '@hooks/use-errand-job-stimulus';
import { faPersonLabel } from '@interfaces/financial-assistance';
import { JobStimulusPeriod } from '@services/job-stimulus-service';
import { Table } from '@sk-web-gui/react';
import { coversCalculationPeriod } from '@utils/job-stimulus-period';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { JobStimulusAddForm } from './job-stimulus-add-form.component';
import { LifecareSourceBadge } from './lifecare-source-badge.component';
import { NormberakningTableBox } from './normberakning-table-box.component';

/** Sökande before medsökande, and each one's periods oldest first — the list reads chronologically. */
const ROLE_ORDER = ['APPLICANT', 'CO_APPLICANT'];
const byRoleThenFromDate = (first: JobStimulusPeriod, second: JobStimulusPeriod): number =>
  ROLE_ORDER.indexOf(first.role ?? '') - ROLE_ORDER.indexOf(second.role ?? '') ||
  (first.fromDate ?? '').localeCompare(second.fromDate ?? '');

/**
 * JOBBSTIMULANS on the Inkomster sub-tab, above the incomes it counts down: the periods on the insats, read
 * from Lifecare, each marked when it covers the beräkning's period — the sökandes lön is then counted down by
 * jobbstimulans. A new period for the sökande is added straight to Lifecare below the list.
 */
export const NormberakningJobStimulus: FC<{
  errandId: string;
  /** The beräkning's period (`yyyy-MM-dd`), to mark the periods that apply to it. */
  calculationFrom?: string;
  calculationTo?: string;
  /** Called after a period is added — the beräkning's result may change with it. */
  onAdded: () => void;
}> = ({ errandId, calculationFrom, calculationTo, onAdded }) => {
  const { t } = useTranslation('calculation');
  const { periods, isLoading, error, refresh } = useErrandJobStimulus(errandId);

  return (
    <NormberakningTableBox title={t('jobStimulus.title')} summary={<LifecareSourceBadge source="LIFECARE" />}>
      <AsyncContent
        isLoading={isLoading}
        error={error}
        errorText={t('jobStimulus.errorText')}
        isEmpty={periods.length === 0}
        emptyText={t('jobStimulus.emptyText')}
      >
        <Table dense>
          <Table.Header>
            <Table.HeaderColumn>{t('jobStimulus.person')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('jobStimulus.from')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('jobStimulus.to')}</Table.HeaderColumn>
            <Table.HeaderColumn>
              <span className="sr-only">{t('jobStimulus.appliesHeading')}</span>
            </Table.HeaderColumn>
          </Table.Header>
          <Table.Body>
            {[...periods].sort(byRoleThenFromDate).map((period, index) => (
              <Table.Row key={`${period.role ?? ''}-${period.fromDate ?? ''}-${String(index)}`}>
                <Table.Column>{faPersonLabel(t, period.role)}</Table.Column>
                <Table.Column className="tabular-nums">{period.fromDate ?? '—'}</Table.Column>
                <Table.Column className="tabular-nums">{period.toDate ?? t('jobStimulus.ongoing')}</Table.Column>
                <Table.Column>
                  {coversCalculationPeriod(period, calculationFrom, calculationTo) ?
                    <span className="text-small rounded-8 px-8 py-2 bg-success-background-100 text-success-surface-primary">
                      {t('jobStimulus.appliesToPeriod')}
                    </span>
                  : null}
                </Table.Column>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </AsyncContent>

      <div className="border-t-1 border-divider pt-16">
        <JobStimulusAddForm
          errandId={errandId}
          onAdded={() => {
            refresh();
            onAdded();
          }}
        />
      </div>
    </NormberakningTableBox>
  );
};
