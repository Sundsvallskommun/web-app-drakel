'use client';

import { useErrandJobStimulus } from '@hooks/use-errand-job-stimulus';
import { faLabel } from '@interfaces/financial-assistance';
import { JobStimulusPeriod } from '@services/job-stimulus-service';
import { Spinner } from '@sk-web-gui/react';
import { formatDateRange } from '@utils/date-range';
import { FC } from 'react';

import { LifecareSourceBadge } from './lifecare-source-badge.component';

type JobStimulusRole = NonNullable<JobStimulusPeriod['role']>;

const ROLES: JobStimulusRole[] = ['APPLICANT', 'CO_APPLICANT'];

/** Oldest period first, so the list reads chronologically. */
const byFromDate = (a: JobStimulusPeriod, b: JobStimulusPeriod): number =>
  (a.fromDate ?? '').localeCompare(b.fromDate ?? '');

/** One party's periods — rendered only when that party has any. */
const PartyPeriods: FC<{ role: JobStimulusRole; periods: JobStimulusPeriod[] }> = ({ role, periods }) =>
  periods.length > 0 ?
    <div className="flex flex-col gap-4">
      <div className="text-small text-dark-secondary">{faLabel('person', role)}</div>
      <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {[...periods].sort(byFromDate).map((period, index) => (
          <li key={`${role}-${period.fromDate ?? ''}-${String(index)}`} className="font-bold">
            {formatDateRange(period.fromDate, period.toDate)}
          </li>
        ))}
      </ul>
    </div>
  : null;

/** The jobbstimulans periods imported from Lifecare, grouped per sökande and medsökande (read-only). */
export const ErrandJobStimulus: FC<{ errandId: string }> = ({ errandId }) => {
  const { periods, isLoading, error } = useErrandJobStimulus(errandId);

  return (
    <section className="flex flex-col gap-12">
      <div className="flex items-center gap-8">
        <h2 className="text-h2-sm md:text-h2-md m-0">Jobbstimulans</h2>
        <LifecareSourceBadge source="LIFECARE" />
      </div>
      {isLoading ?
        <Spinner size={3} />
      : error ?
        <p className="text-error-surface-primary m-0">Det gick inte att hämta jobbstimulansperioder</p>
      : periods.length === 0 ?
        <p className="m-0 text-dark-secondary">Inga jobbstimulansperioder.</p>
      : <div className="grid grid-cols-1 md:grid-cols-2 gap-x-40 gap-y-12">
          {ROLES.map((role) => (
            <PartyPeriods key={role} role={role} periods={periods.filter((period) => period.role === role)} />
          ))}
        </div>
      }
    </section>
  );
};
