/**
 * The status "views" in the overview sidebar — a small fixed set that replaces the per-status list:
 * Alla (no status filter), Nya (RECEIVED), Öppna (everything except CLOSED) and Avslutade (CLOSED).
 */
export type ErrandView = 'all' | 'new' | 'open' | 'closed';

export interface ErrandViewItem {
  key: ErrandView;
  label: string;
}

export const ERRAND_VIEWS: ErrandViewItem[] = [
  { key: 'all', label: 'Alla ärenden' },
  { key: 'new', label: 'Nya ärenden' },
  { key: 'open', label: 'Öppna ärenden' },
  { key: 'closed', label: 'Avslutade ärenden' },
];

/** "Nya ärenden" filters on this status; "Avslutade ärenden" on CLOSED; "Öppna ärenden" is everything but CLOSED. */
export const NEW_ERRAND_STATUS = 'RECEIVED';
export const CLOSED_ERRAND_STATUS = 'CLOSED';
