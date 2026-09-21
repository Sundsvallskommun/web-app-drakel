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

/**
 * A stakeholder as Lifecare lists them in the utbetalning form: "Efternamn, Förnamn", prefixed with the
 * personal number when there is one (e.g. "880209-T050 Testsson, Test").
 */
export const stakeholderListLabel = (stakeholder: Stakeholder, fallback = 'Okänd intressent'): string => {
  const sortedName = [stakeholder.lastName, stakeholder.firstName].filter(Boolean).join(', ');
  const name = stakeholder.organizationName ?? (sortedName.length > 0 ? sortedName : fallback);
  return [stakeholder.personalNumber, name].filter(Boolean).join(' ');
};
