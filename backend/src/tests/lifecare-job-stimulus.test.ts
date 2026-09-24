import { LifecareJobStimulusRaw } from '@interfaces/lifecare-job-stimulus.interface';
import { buildJobStimulusAdd } from '@utils/lifecare-job-stimulus';
import { describe, expect, it } from 'vitest';

const period = (jobStimulusId: number, fromDate: string, toDate: string) => ({
  jobStimulusId,
  personId: '19880209T050',
  fromDate,
  toDate,
  updateTimestamp: '2026-08-21',
  updateSignature: 'ebb14eri',
  markedForRemoval: false,
  personIdFormatted: '880209-T050',
});

/** Calculation/GetJobStimulusForService?businessType=8&businessId=1 (capture 2026-09-24). */
const current = (): LifecareJobStimulusRaw => ({
  applicant: {
    periods: [period(101, '2021-01-01', '2021-12-31'), period(102, '2022-07-08', '2023-07-07'), period(103, '2026-01-01', '2027-12-31')],
    personId: '19880209T050',
    name: 'Testsson, Test',
    personIdFormatted: '880209-T050',
  },
  coApplicant: null,
  hasCoApplicant: false,
});

describe('buildJobStimulusAdd', () => {
  it('turns the read periods and a new one into exactly the captured SaveJobStimulus body', () => {
    const save = buildJobStimulusAdd(current(), { fromDate: '2028-01-15', toDate: '2030-01-14' });

    // Calculation/SaveJobStimulus (capture 2026-09-24), field for field and in order.
    const capture = {
      applicant: {
        periods: [
          { ...period(101, '2021-01-01', '2021-12-31'), isValid: true, minDate: 0 },
          { ...period(102, '2022-07-08', '2023-07-07'), isValid: true, minDate: '2021-12-31' },
          { ...period(103, '2026-01-01', '2027-12-31'), isValid: true, minDate: '2023-07-07' },
          { personId: '19880209T050', personIdFormatted: '880209-T050', fromDate: '2028-01-15', toDate: '2030-01-14', markedForRemoval: false },
        ],
        personId: '19880209T050',
        name: 'Testsson, Test',
        personIdFormatted: '880209-T050',
      },
      coApplicant: { personId: '', personIdFormatted: '', name: '', periods: [] },
    };
    expect(save.writable ? JSON.stringify(save.body) : save.reason).toBe(JSON.stringify(capture));
  });

  it('adds the first period of someone who has none', () => {
    const none = current();
    if (none.applicant) {
      none.applicant.periods = [];
    }

    const save = buildJobStimulusAdd(none, { fromDate: '2026-10-01', toDate: '2028-09-30' });

    expect(save.writable && save.body.applicant).toMatchObject({ periods: [{ fromDate: '2026-10-01', toDate: '2028-09-30' }] });
  });

  it('refuses a household with a medsökande, whose periods would otherwise be lost', () => {
    const withCoApplicant = { ...current(), hasCoApplicant: true };

    expect(buildJobStimulusAdd(withCoApplicant, { fromDate: '2028-01-15', toDate: '2030-01-14' }).writable).toBe(false);
  });
});
