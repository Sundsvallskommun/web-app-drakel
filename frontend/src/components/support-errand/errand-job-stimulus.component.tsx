'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { useErrandJobStimulus } from '@hooks/use-errand-job-stimulus';
import { faLabel } from '@interfaces/financial-assistance';
import { JobStimulusPeriod } from '@services/job-stimulus-service';
import { formatDateRange } from '@utils/date-range';
import { FC } from 'react';

import { ContentBox } from './content-box.component';
import { LabeledValue } from './labeled-value.component';
import { LifecareSourceBadge } from './lifecare-source-badge.component';

type JobStimulusRole = NonNullable<JobStimulusPeriod['role']>;

const ROLES: JobStimulusRole[] = ['APPLICANT', 'CO_APPLICANT'];

/** Oldest period first, so the list reads chronologically. */
const byFromDate = (a: JobStimulusPeriod, b: JobStimulusPeriod): number =>
  (a.fromDate ?? '').localeCompare(b.fromDate ?? '');

/** One party's periods — rendered only when that party has any. */
const PartyPeriods: FC<{ role: JobStimulusRole; periods: JobStimulusPeriod[] }> = ({ role, periods }) =>
  periods.length > 0 ?
    <LabeledValue label={faLabel('person', role)}>
      <span className="flex flex-col gap-4">
        {[...periods].sort(byFromDate).map((period, index) => (
          <span key={`${role}-${period.fromDate ?? ''}-${String(index)}`}>
            {formatDateRange(period.fromDate, period.toDate)}
          </span>
        ))}
      </span>
    </LabeledValue>
  : null;

/**
 * The jobbstimulans periods imported from Lifecare, grouped per sökande and medsökande (read-only), in a
 * grey box marked "Från Lifecare".
 */
export const ErrandJobStimulus: FC<{ errandId: string }> = ({ errandId }) => {
  const { periods, isLoading, error } = useErrandJobStimulus(errandId);

  return (
    <ContentBox title="Jobbstimulansperioder" action={<LifecareSourceBadge source="LIFECARE" />}>
      <AsyncContent
        isLoading={isLoading}
        error={error}
        errorText="Det gick inte att hämta jobbstimulansperioder"
        isEmpty={periods.length === 0}
        emptyText="Inga jobbstimulansperioder."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-24">
          {ROLES.map((role) => (
            <PartyPeriods key={role} role={role} periods={periods.filter((period) => period.role === role)} />
          ))}
        </div>
      </AsyncContent>
    </ContentBox>
  );
};
