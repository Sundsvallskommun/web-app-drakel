'use client';

import { NormTypeOption } from '@data-contracts/backend/data-contracts';
import { updateNormHeader } from '@services/normberakning-service';
import { Select } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The normberäkning's Norm, picked from Lifecare's norms for the insats. It is saved as it changes — in careM's
 * draft before the beräkning is in Lifecare, in Lifecare after that, where the members are placed on the new
 * norm. Until Lifecare's norms have loaded, the norm the beräkning has is shown.
 */
export const NormSelect: FC<{
  errandId: string;
  normId?: number;
  /** The norm's name as the beräkning carries it — shown until the list has loaded. */
  normName?: string;
  norms: NormTypeOption[];
  disabled?: boolean;
  onChanged: () => void;
}> = ({ errandId, normId, normName, norms, disabled = false, onChanged }) => {
  const { t } = useTranslation('calculation');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const current = normId === undefined ? '' : String(normId);
  const knowsCurrent = norms.some((norm) => norm.code === current);

  const change = async (next: string): Promise<void> => {
    if (!next || next === current) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const result = await updateNormHeader(errandId, { normId: Number(next) });
    setSaving(false);
    if (result.error) {
      setError(result.message ?? t('details.normError'));
      return;
    }
    onChanged();
  };

  return (
    <div className="flex flex-col gap-4">
      <Select
        size="sm"
        aria-label={t('details.norm')}
        value={current}
        disabled={disabled || saving || norms.length === 0}
        onChange={(event) => void change(event.target.value)}
      >
        {knowsCurrent ? null : <Select.Option value={current}>{normName ?? '—'}</Select.Option>}
        {norms.map((norm) => (
          <Select.Option key={norm.code} value={norm.code ?? ''}>
            {norm.displayName ?? norm.code}
          </Select.Option>
        ))}
      </Select>
      {error ?
        <span className="text-small text-error-surface-primary">{error}</span>
      : null}
    </div>
  );
};
