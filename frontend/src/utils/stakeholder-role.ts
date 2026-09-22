// Display order: applicant first, then co-applicant, children and umgängesbarn; unknown roles last.
const ROLE_ORDER = ['APPLICANT', 'CO_APPLICANT', 'CHILD', 'VISITATION_CHILD'];

const roleOrderIndex = (role?: string): number => {
  const index = ROLE_ORDER.indexOf(role ?? '');
  return index === -1 ? ROLE_ORDER.length : index;
};

/** Comparator that orders people/stakeholders by role — sökande (applicant) first. */
export const compareByRole = (a: { role?: string }, b: { role?: string }): number =>
  roleOrderIndex(a.role) - roleOrderIndex(b.role);
