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

interface NormberakningGemensammaProps {
  hasCustomHouseholdSize?: boolean;
  householdSize?: number;
}

/**
 * GEMENSAMMA KOSTNADER view. The household size comes from the draft header (read-only here); the
 * per-household-size amounts are computed in Lifecare and not exposed by the API yet.
 */
export const NormberakningGemensamma: FC<NormberakningGemensammaProps> = ({ hasCustomHouseholdSize, householdSize }) => (
  <div className="flex flex-col gap-16 py-24">
    <Checkbox checked={!!hasCustomHouseholdSize} disabled>
      Annan hushållsstorlek
    </Checkbox>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-24">
      <Field label="Hushållsstorlek" value={householdSize == null ? '—' : String(householdSize)} />
      <Field label="Belopp för 1 persons hushåll" value="—" />
      <Field label="Summa" value="—" />
    </div>

    <p className="text-small text-dark-secondary m-0">
      Beloppen för gemensamma kostnader beräknas i Lifecare och exponeras inte av API:t ännu.
    </p>
  </div>
);
