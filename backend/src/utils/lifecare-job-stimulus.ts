import { LifecareJobStimulusRaw } from '@interfaces/lifecare-job-stimulus.interface';

/** Either the `SaveJobStimulus` body, or why the change cannot be sent as it stands. */
export type JobStimulusSave = { writable: true; body: Record<string, unknown> } | { writable: false; reason: string };

/** What the web app sends for the medsökande when the household has none. */
const NO_CO_APPLICANT = { personId: '', personIdFormatted: '', name: '', periods: [] };

/** A new jobbstimulans period for the sökande. */
export interface NewJobStimulusPeriod {
  /** `yyyy-MM-dd`. */
  fromDate: string;
  /** `yyyy-MM-dd` — Lifecare's two-year rule unless the handläggare set an earlier end. */
  toDate: string;
}

/**
 * Builds the `SaveJobStimulus` body that adds a period for the sökande, the way Lifecare's web app does
 * (capture 2026-09-24).
 *
 * The endpoint replaces the person's whole set of periods — one left out is deleted — so every period
 * Lifecare holds goes back, in its order, with the two fields the web app adds: `isValid`, and `minDate`,
 * the end of the period before it (0 for the first). The new one goes last, carrying only what the web app
 * gives a new period; Lifecare numbers it.
 *
 * A household with a medsökande is refused: how the web app sends the medsökandes periods back is not
 * captured, and getting it wrong would delete them.
 */
export const buildJobStimulusAdd = (current: LifecareJobStimulusRaw, period: NewJobStimulusPeriod): JobStimulusSave => {
  const { applicant } = current;
  if (!applicant) {
    return { writable: false, reason: 'Sökande finns inte på insatsen i Lifecare.' };
  }
  if (current.hasCoApplicant || current.coApplicant) {
    return {
      writable: false,
      reason: 'Hushållet har en medsökande. Jobbstimulans kan inte ändras från Drakel för sådana hushåll ännu. Gör det direkt i Lifecare.',
    };
  }

  const periods = [
    ...applicant.periods.map((existing, index) => ({
      ...existing,
      isValid: true,
      minDate: index === 0 ? 0 : (applicant.periods[index - 1]?.toDate ?? 0),
    })),
    {
      personId: applicant.personId,
      personIdFormatted: applicant.personIdFormatted,
      fromDate: period.fromDate,
      toDate: period.toDate,
      markedForRemoval: false,
    },
  ];

  return {
    writable: true,
    body: {
      applicant: { periods, personId: applicant.personId, name: applicant.name, personIdFormatted: applicant.personIdFormatted },
      coApplicant: NO_CO_APPLICANT,
    },
  };
};
