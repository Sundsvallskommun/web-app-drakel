/** Swedish display names for the financial-assistance errand statuses (the STATUS metadata lookups). */
const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Inkommen',
  NEEDS_MANUAL_REVIEW: 'Kräver manuell granskning',
  UNDER_REVIEW: 'Under utredning',
  SUPPLEMENT_REQUESTED: 'Komplettering begärd',
  AWAITING_DECISION: 'Väntar på beslut',
  GRANTED: 'Beviljad',
  REJECTED: 'Avslagen',
  PAID: 'Utbetald',
  WITHDRAWN: 'Återtagen',
  CLOSED: 'Avslutad',
};

/** The Swedish display name for an errand status; unknown statuses fall back to the raw status text. */
export const errandStatusLabel = (status: string): string => STATUS_LABELS[status.toUpperCase()] ?? status;
