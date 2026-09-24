'use client';

import { NormRowOption } from '@data-contracts/backend/data-contracts';
import { NormPersonRow, updateNormRow } from '@services/normberakning-service';
import { Input, Select, Table } from '@sk-web-gui/react';
import { displayAmount } from '@utils/format-amount';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

type RowAction = () => Promise<{ error?: unknown; message?: string }>;

/** Days as typed: a whole number, or nothing — the whole period. */
const parseDays = (value: string): number | undefined => {
  const days = Number.parseInt(value.trim(), 10);
  return Number.isFinite(days) && days >= 0 ? days : undefined;
};

/**
 * A member of a normberäkning saved in Lifecare. The handläggare sets the member's days in the household and
 * normintervall, saved in Lifecare as they change — Lifecare counts the amount from both. No days means the
 * whole period. Who is in the beräkning is Lifecare's: no one is taken out from Drakel.
 */
export const FamiljPersonRow: FC<{
  errandId: string;
  person: NormPersonRow;
  /** The norm's rows the member can be put on. */
  normRows: NormRowOption[];
  onAction: (action: RowAction) => void;
}> = ({ errandId, person, normRows, onAction }) => {
  const { t } = useTranslation('calculation');
  const [days, setDays] = useState<string>(person.caseworkerDays?.toString() ?? '');
  const rowId = person.id ?? '';

  const save = (nextDays: number | undefined, normRowId: number | undefined): void => {
    onAction(() => updateNormRow(errandId, 'persons', rowId, { caseworkerDays: nextDays, normRowId }));
  };

  const saveDaysIfChanged = (): void => {
    const nextDays = parseDays(days);
    if (nextDays !== person.caseworkerDays) {
      save(nextDays, person.normRowId);
    }
  };

  return (
    <Table.Row>
      <Table.Column className="tabular-nums">{person.personalNumber ?? '—'}</Table.Column>
      <Table.Column>{person.name ?? '—'}</Table.Column>
      <Table.Column className="tabular-nums">{displayAmount(person.amount)}</Table.Column>
      <Table.Column>
        <Input
          size="sm"
          className="max-w-[7rem]"
          inputMode="numeric"
          aria-label={t('family.days')}
          placeholder={t('family.wholePeriod')}
          value={days}
          onChange={(event) => {
            setDays(event.target.value);
          }}
          onBlur={saveDaysIfChanged}
        />
      </Table.Column>
      <Table.Column>
        <Select
          size="sm"
          aria-label={t('family.normInterval')}
          value={person.normRowId?.toString() ?? ''}
          onChange={(event) => {
            const normRowId = Number(event.target.value);
            if (normRowId > 0) {
              save(parseDays(days), normRowId);
            }
          }}
        >
          <Select.Option value="" />
          {normRows.map((row) => (
            <Select.Option key={row.id} value={String(row.id)}>
              {row.name}
            </Select.Option>
          ))}
        </Select>
      </Table.Column>
    </Table.Row>
  );
};
