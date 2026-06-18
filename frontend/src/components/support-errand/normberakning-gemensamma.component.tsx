'use client';

import { Checkbox } from '@sk-web-gui/react';
import { FC } from 'react';

/** A read-only labelled value used in the GEMENSAMMA KOSTNADER view. */
const Field: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-2">
    <span className="text-small text-dark-secondary">{label}</span>
    <span className="font-bold tabular-nums">{value}</span>
  </div>
);

/**
 * Lifecare's GEMENSAMMA KOSTNADER view (visual foundation). The household size and shared-cost amounts
 * are computed in Lifecare and not exposed by caremanagement, so the fields are a structural shell.
 */
export const NormberakningGemensamma: FC = () => (
  <div className="flex flex-col gap-16 py-24">
    <Checkbox defaultChecked disabled>
      Annan hushållsstorlek
    </Checkbox>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-24">
      <Field label="Antal personer" value="—" />
      <Field label="Hushållsstorlek" value="—" />
      <Field label="Belopp för 1 persons hushåll" value="—" />
      <Field label="Summa" value="—" />
    </div>

    <p className="text-small text-dark-secondary m-0">
      Exponeras inte av caremanagement-API:t ännu – visuell grund.
    </p>
  </div>
);
