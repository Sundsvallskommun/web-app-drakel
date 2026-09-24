/**
 * One jobbstimulans period as Lifecare's `Calculation/GetJobStimulusForService` returns it (capture
 * 2026-09-24). Carries the personnummer: never log it.
 */
export interface LifecareJobStimulusPeriodRaw {
  jobStimulusId: number;
  personId: string;
  fromDate: string;
  /** Empty for a period without an end. */
  toDate: string;
  updateTimestamp: string;
  updateSignature: string;
  markedForRemoval: boolean;
  personIdFormatted: string;
}

/** One person's jobbstimulans periods. */
interface LifecareJobStimulusPersonRaw {
  periods: LifecareJobStimulusPeriodRaw[];
  personId: string;
  name: string;
  personIdFormatted: string;
}

/** The sökandes and the medsökandes jobbstimulans on an insats. `coApplicant` is null without a medsökande. */
export interface LifecareJobStimulusRaw {
  applicant: LifecareJobStimulusPersonRaw | null;
  coApplicant: LifecareJobStimulusPersonRaw | null;
  hasCoApplicant: boolean;
}
