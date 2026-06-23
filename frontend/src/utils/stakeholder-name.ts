import { Stakeholder } from '@data-contracts/backend/data-contracts';

/** Display name for a stakeholder: organization name, else "Förnamn Efternamn", else a fallback. */
export const stakeholderDisplayName = (stakeholder: Stakeholder): string => {
  if (stakeholder.organizationName) {
    return stakeholder.organizationName;
  }
  const personName = [stakeholder.firstName, stakeholder.lastName].filter(Boolean).join(' ');
  return personName.length > 0 ? personName : 'Okänd intressent';
};
