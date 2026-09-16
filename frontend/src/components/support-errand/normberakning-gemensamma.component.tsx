'use client';

import { Checkbox } from '@sk-web-gui/react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { NormberakningTableBox } from './normberakning-table-box.component';

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
export const NormberakningGemensamma: FC<NormberakningGemensammaProps> = ({
  hasCustomHouseholdSize,
  householdSize,
}) => {
  const { t } = useTranslation('calculation');

  return (
    <NormberakningTableBox title={t('sharedCosts.title')}>
      <Checkbox checked={!!hasCustomHouseholdSize} disabled>
        {t('sharedCosts.customHouseholdSize')}
      </Checkbox>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-24">
        <Field label={t('sharedCosts.householdSize')} value={householdSize == null ? '—' : String(householdSize)} />
        <Field label={t('sharedCosts.onePersonHouseholdAmount')} value="—" />
        <Field label={t('sharedCosts.sum')} value="—" />
      </div>

      <p className="text-small text-dark-secondary m-0">{t('sharedCosts.info')}</p>
    </NormberakningTableBox>
  );
};
