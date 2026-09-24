'use client';

import { deleteNormRow, NormPersonRow, updateNormRow } from '@services/normberakning-service';
import { Button, Checkbox, DatePicker, Table } from '@sk-web-gui/react';
import { displayAmount } from '@utils/format-amount';
import { Trash2 } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

type RowAction = () => Promise<{ error?: unknown; message?: string }>;

/**
 * A member of a normberäkning saved in Lifecare: whether they are in it, and the dates they are in the
 * household (Ingår från/till), saved in Lifecare as they change. Anyone but the sökande — the first member —
 * can be taken out.
 */
export const FamiljPersonRow: FC<{
  errandId: string;
  person: NormPersonRow;
  removable: boolean;
  onAction: (action: RowAction) => void;
}> = ({ errandId, person, removable, onAction }) => {
  const { t } = useTranslation('calculation');
  const [from, setFrom] = useState<string>(person.deviationFromDate ?? '');
  const [to, setTo] = useState<string>(person.deviationToDate ?? '');
  const rowId = person.id ?? '';

  const save = (included: boolean, fromDate: string, toDate: string): void => {
    onAction(() =>
      updateNormRow(errandId, 'persons', rowId, {
        included,
        deviationFromDate: fromDate || undefined,
        deviationToDate: toDate || undefined,
      })
    );
  };

  const saveDatesIfChanged = (): void => {
    if (from !== (person.deviationFromDate ?? '') || to !== (person.deviationToDate ?? '')) {
      save(person.included ?? false, from, to);
    }
  };

  return (
    <Table.Row>
      <Table.Column>
        <Checkbox
          checked={person.included ?? false}
          aria-label={t('family.included')}
          onChange={(event) => {
            save(event.target.checked, from, to);
          }}
        />
      </Table.Column>
      <Table.Column className="tabular-nums">{person.personalNumber ?? '—'}</Table.Column>
      <Table.Column>{person.name ?? '—'}</Table.Column>
      <Table.Column className="tabular-nums">{displayAmount(person.amount)}</Table.Column>
      <Table.Column>
        <DatePicker
          type="date"
          size="sm"
          aria-label={t('family.includedFrom')}
          value={from}
          onChange={(event) => {
            setFrom(event.target.value);
          }}
          onBlur={saveDatesIfChanged}
        />
      </Table.Column>
      <Table.Column>
        <DatePicker
          type="date"
          size="sm"
          aria-label={t('family.includedTo')}
          value={to}
          onChange={(event) => {
            setTo(event.target.value);
          }}
          onBlur={saveDatesIfChanged}
        />
      </Table.Column>
      <Table.Column className="tabular-nums">{person.effectiveDays ?? '—'}</Table.Column>
      <Table.Column>{person.normInterval ?? '—'}</Table.Column>
      <Table.Column>
        {removable ?
          <Button
            size="sm"
            variant="tertiary"
            iconButton
            aria-label={t('family.remove', { name: person.name ?? '' })}
            leftIcon={<Trash2 />}
            onClick={() => {
              onAction(() => deleteNormRow(errandId, 'persons', rowId));
            }}
          />
        : null}
      </Table.Column>
    </Table.Row>
  );
};
