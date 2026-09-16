import { Errand } from '@/data-contracts/caremanagement/data-contracts';

import CaremanagementStakeholderService, { PartyReference } from './caremanagement-stakeholder.service';
import CitizenService, { personDisplayName, PersonName } from './citizen.service';

/** An errand from the list endpoint with the co-applicant name(s) added by the BFF. */
type ErrandWithApplicantNames = Errand & { coApplicantName?: string };

const resolveName = (party: PartyReference, names: Map<string, PersonName>): string | undefined => {
  if (party.name) {
    return party.name;
  }
  const resolved = party.partyId ? names.get(party.partyId.toLowerCase()) : undefined;
  return resolved ? personDisplayName(resolved) : undefined;
};

/**
 * Adds the applicant and co-applicant names to errands from the list endpoint. caremanagement only denormalizes
 * `applicantName`, and only when the APPLICANT stakeholder has a stored name, which applications from Mina sidor
 * don't (they carry the partyId). So the applicant/co-applicant stakeholders are read per errand and every
 * missing name is resolved in one Citizen call.
 */
class ApplicantNameService {
  private stakeholderService = new CaremanagementStakeholderService();
  private citizenService = new CitizenService();

  async addApplicantNames(errands: Errand[]): Promise<ErrandWithApplicantNames[]> {
    // Best-effort per errand: a failing stakeholder lookup just leaves that errand's names as they are.
    const partiesPerErrand = await Promise.all(
      errands.map(errand => (errand.id ? this.stakeholderService.readApplicants(errand.id).catch(() => undefined) : Promise.resolve(undefined))),
    );

    const partyIds = partiesPerErrand.flatMap(parties =>
      parties ? [parties.applicant, ...parties.coApplicants].flatMap(party => (party?.partyId ? [party.partyId] : [])) : [],
    );
    const names = await this.citizenService.getNamesByPartyId(partyIds);

    return errands.map((errand, index) => {
      const parties = partiesPerErrand[index];
      if (!parties) {
        return errand;
      }
      const applicantName = errand.applicantName ?? (parties.applicant ? resolveName(parties.applicant, names) : undefined);
      const coApplicantName = parties.coApplicants
        .map(party => resolveName(party, names))
        .filter(Boolean)
        .join(', ');
      return {
        ...errand,
        ...(applicantName ? { applicantName } : {}),
        ...(coApplicantName ? { coApplicantName } : {}),
      };
    });
  }
}

export default ApplicantNameService;
