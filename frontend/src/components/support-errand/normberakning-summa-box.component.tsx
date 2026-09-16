import { FC } from 'react';

/**
 * The total shown to the right of a normberäkning table's title (e.g. "Summa inkomster 23 640,00"),
 * inside the sub-tab's grey table box.
 */
export const NormberakningSummaBox: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-16 text-small">
    <span className="font-bold">{label}</span>
    <span className="tabular-nums text-dark-primary">{value}</span>
  </div>
);
