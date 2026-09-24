'use client';

import { updateNormHeader } from '@services/normberakning-service';
import { Checkbox, FormControl, FormLabel, Input } from '@sk-web-gui/react';
import { displayAmount } from '@utils/format-amount';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NormberakningTableBox } from './normberakning-table-box.component';

/** A read-only labelled value used in the GEMENSAMMA KOSTNADER view. */
const Field: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-2">
    <span className="text-small text-dark-secondary">{label}</span>
    <span className="font-bold tabular-nums">{value}</span>
  </div>
);

/** A household size as typed: a whole number of at least one, or nothing. */
const parseSize = (value: string): number | undefined => {
  const size = Number.parseInt(value.trim(), 10);
  return Number.isFinite(size) && size >= 1 ? size : undefined;
};

interface NormberakningGemensammaProps {
  errandId: string;
  hasCustomHouseholdSize?: boolean;
  householdSize?: number;
  /** How many members the beräkning includes — the household size when there is no own one. */
  familyMembers?: number;
  /** Lifecare's gemensamma kostnader for a household of the household size; absent before it is saved there. */
  amountForHouseholdSize?: number;
  /** The members' share of them (Summa); absent before the beräkning is saved in Lifecare. */
  commonHouseholdCost?: number;
  onChanged: () => void;
}

/**
 * GEMENSAMMA KOSTNADER. The handläggare can give the household an own size (Annan hushållsstorlek); it is
 * saved as it changes — in careM's draft before the beräkning is in Lifecare, in Lifecare after that, where it
 * is also kept for the household's coming beräkningar. Lifecare counts the amounts from the size.
 */
export const NormberakningGemensamma: FC<NormberakningGemensammaProps> = ({
  errandId,
  hasCustomHouseholdSize = false,
  householdSize,
  familyMembers,
  amountForHouseholdSize,
  commonHouseholdCost,
  onChanged,
}) => {
  const { t } = useTranslation('calculation');
  const [size, setSize] = useState<string>(householdSize?.toString() ?? familyMembers?.toString() ?? '');
  const [error, setError] = useState<string>();
  const shownSize = hasCustomHouseholdSize ? householdSize : (familyMembers ?? householdSize);

  const save = async (custom: boolean, nextSize: number | undefined): Promise<void> => {
    setError(undefined);
    const result = await updateNormHeader(errandId, {
      hasCustomHouseholdSize: custom,
      householdSize: custom ? nextSize : undefined,
    });
    if (result.error) {
      setError(result.message ?? t('table.saveError'));
      return;
    }
    onChanged();
  };

  return (
    <NormberakningTableBox title={t('sharedCosts.title')}>
      {error ?
        <p className="text-error-surface-primary m-0">{error}</p>
      : null}
      <Checkbox
        checked={hasCustomHouseholdSize}
        onChange={(event) => {
          const custom = event.target.checked;
          // An own size starts from what the household is now.
          void save(custom, custom ? (parseSize(size) ?? familyMembers ?? 1) : undefined);
        }}
      >
        {t('sharedCosts.customHouseholdSize')}
      </Checkbox>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-24 items-end">
        {hasCustomHouseholdSize ?
          <FormControl id="household-size" className="w-[10rem]">
            <FormLabel>{t('sharedCosts.householdSize')}</FormLabel>
            <Input
              size="sm"
              inputMode="numeric"
              value={size}
              onChange={(event) => {
                setSize(event.target.value);
              }}
              onBlur={() => {
                const nextSize = parseSize(size);
                if (nextSize !== undefined && nextSize !== householdSize) {
                  void save(true, nextSize);
                }
              }}
            />
          </FormControl>
        : <Field label={t('sharedCosts.householdSize')} value={shownSize == null ? '—' : String(shownSize)} />}
        <Field
          label={t('sharedCosts.householdAmount', { size: shownSize ?? '—' })}
          value={displayAmount(amountForHouseholdSize)}
        />
        <Field label={t('sharedCosts.sum')} value={displayAmount(commonHouseholdCost)} />
      </div>

      {amountForHouseholdSize === undefined ?
        <p className="text-small text-dark-secondary m-0">{t('sharedCosts.info')}</p>
      : null}
    </NormberakningTableBox>
  );
};
