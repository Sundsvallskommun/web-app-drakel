import ApplicantNameService from '@services/applicant-name.service';
import CaremanagementApiService from '@services/caremanagement-api.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import CitizenService from '@services/citizen.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Stakeholder } from '@/data-contracts/caremanagement/data-contracts';

const stakeholdersAnswer = (data: Stakeholder[]) => ({ data, message: 'success', status: 200 });

describe('CaremanagementStakeholderService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the sökande's partyId from the stakeholders alone, without asking Citizen", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(
      stakeholdersAnswer([
        { role: 'CO_APPLICANT', externalId: 'co-applicant-party' },
        { role: 'APPLICANT', externalId: 'applicant-party' },
      ]),
    );
    const citizen = vi.spyOn(CitizenService.prototype, 'getPersonnumber');

    expect(await new CaremanagementStakeholderService().readApplicantPartyId('errand-1')).toBe('applicant-party');
    expect(citizen).not.toHaveBeenCalled();
  });

  it('asks Citizen for the names of the stakeholders that have a partyId, and only those', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(
      stakeholdersAnswer([{ role: 'APPLICANT', externalId: 'applicant-party' }, { role: 'CHILD' }]),
    );
    vi.spyOn(CitizenService.prototype, 'getPersonnumber').mockResolvedValue(null);
    const names = vi.spyOn(CitizenService.prototype, 'getNamesByPartyId').mockResolvedValue(new Map());

    await new CaremanagementStakeholderService().readStakeholders('errand-1');

    expect(names).toHaveBeenCalledWith(['applicant-party']);
  });
});

describe('ApplicantNameService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads a list page’s stakeholders a few errands at a time, not all at once', async () => {
    let inFlight = 0;
    let mostInFlight = 0;
    vi.spyOn(CaremanagementStakeholderService.prototype, 'readApplicants').mockImplementation(async () => {
      inFlight += 1;
      mostInFlight = Math.max(mostInFlight, inFlight);
      await new Promise(resolve => setTimeout(resolve, 2));
      inFlight -= 1;
      return { applicant: { name: 'Test Testsson' }, coApplicants: [] };
    });
    vi.spyOn(CitizenService.prototype, 'getNamesByPartyId').mockResolvedValue(new Map());
    const errands = Array.from({ length: 30 }, (_entry, index) => ({ id: `errand-${index}` }));

    const named = await new ApplicantNameService().addApplicantNames(errands);

    expect(named).toHaveLength(30);
    expect(named.every(errand => errand.applicantName === 'Test Testsson')).toBe(true);
    expect(mostInFlight).toBeGreaterThan(1);
    expect(mostInFlight).toBeLessThanOrEqual(6);
  });
});
