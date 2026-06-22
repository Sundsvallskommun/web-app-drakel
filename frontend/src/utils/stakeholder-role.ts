/** Swedish labels for caremanagement stakeholder / normberäkning person roles. */
const ROLE_LABELS: Record<string, string> = {
  APPLICANT: 'Sökande',
  CO_APPLICANT: 'Medsökande',
  CHILD: 'Barn',
  UMGANGESBARN: 'Umgängesbarn',
};

/** The Swedish label for a role code, falling back to the raw code (empty string when no role). */
export const stakeholderRoleLabel = (role?: string): string => (role ? (ROLE_LABELS[role] ?? role) : '');

// Display order: applicant first, then co-applicant, children and umgängesbarn; unknown roles last.
const ROLE_ORDER = ['APPLICANT', 'CO_APPLICANT', 'CHILD', 'UMGANGESBARN'];

const roleOrderIndex = (role?: string): number => {
  const index = ROLE_ORDER.indexOf(role ?? '');
  return index === -1 ? ROLE_ORDER.length : index;
};

/** Comparator that orders people/stakeholders by role — sökande (applicant) first. */
export const compareByRole = (a: { role?: string }, b: { role?: string }): number =>
  roleOrderIndex(a.role) - roleOrderIndex(b.role);
