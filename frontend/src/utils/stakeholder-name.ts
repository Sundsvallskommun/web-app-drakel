import { Stakeholder } from '@data-contracts/backend/data-contracts';

/**
 * Display name for a stakeholder: organization name, else "Förnamn Efternamn", else `fallback` (Swedish by
 * default, for documents; UI callers pass a translated text).
 */
export const stakeholderDisplayName = (stakeholder: Stakeholder, fallback = 'Okänd intressent'): string => {
  if (stakeholder.organizationName) {
    return stakeholder.organizationName;
  }
  const personName = [stakeholder.firstName, stakeholder.lastName].filter(Boolean).join(' ');
  return personName.length > 0 ? personName : fallback;
};
