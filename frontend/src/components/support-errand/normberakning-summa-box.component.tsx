import { FC } from 'react';

/**
 * The grey, right-aligned total box shown above each Lifecare normberäkning table
 * (e.g. "Summa norm 23640,00"). Mirrors the Lifecare layout in sk-web-gui styling.
 */
export const NormberakningSummaBox: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="self-end flex items-center gap-32 border-1 border-divider bg-background-200 rounded-8 px-16 py-8">
    <span className="font-bold text-small">{label}</span>
    <span className="text-small tabular-nums">{value}</span>
  </div>
);
