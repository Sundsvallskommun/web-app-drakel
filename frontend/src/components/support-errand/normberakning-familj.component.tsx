'use client';

import { NormRowOption } from '@data-contracts/backend/data-contracts';
import { NormPersonRow } from '@services/normberakning-service';
import { Table } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FamiljPersonRow } from './familj-person-row.component';
import { NormberakningTableBox } from './normberakning-table-box.component';

const days = (value?: number): string => (value == null ? '—' : String(value));
const displayAmount = (value?: number): string => (value == null ? '—' : formatAmount(value));

/** A member of careM's draft, as the ansökan gave it — shown, not changed. */
const ReadOnlyPersonRow: FC<{ person: NormPersonRow }> = ({ person }) => (
  <Table.Row>
    <Table.Column className="tabular-nums">{person.personalNumber ?? '—'}</Table.Column>
    <Table.Column>{person.name ?? '—'}</Table.Column>
    <Table.Column className="tabular-nums">{displayAmount(person.amount)}</Table.Column>
    <Table.Column className="tabular-nums">{days(person.effectiveDays)}</Table.Column>
    <Table.Column>{person.normInterval ?? '—'}</Table.Column>
  </Table.Row>
);

/**
 * PERSONER SOM OMFATTAS — the persons the norm covers, with their days in the household and normintervall.
 * Read-only while the rows are careM's draft; once the beräkning is saved in Lifecare (`editable`), the days and
 * normintervall of each member can be changed there — Lifecare counts the amount from them — and anyone but
 * the sökande taken out.
 */
export const NormberakningFamilj: FC<{
  persons: NormPersonRow[];
  errandId: string;
  /** The norm's rows a member can be put on — a beräkning in Lifecare only. */
  normRows?: NormRowOption[];
  editable?: boolean;
  onChanged?: () => void;
}> = ({ persons, errandId, normRows = [], editable = false, onChanged }) => {
  const { t } = useTranslation('calculation');
  const [error, setError] = useState<string>();
  const visiblePersons = persons.filter((person) => !person.deleted);

  const runRowAction = async (action: () => Promise<{ error?: unknown; message?: string }>): Promise<void> => {
    setError(undefined);
    const result = await action();
    if (result.error) {
      setError(result.message ?? t('table.saveError'));
      return;
    }
    onChanged?.();
  };

  return (
    <NormberakningTableBox title={t('family.title')}>
      {error ?
        <p className="text-error-surface-primary m-0">{error}</p>
      : null}
      <Table dense>
        <Table.Header>
          <Table.HeaderColumn>{t('family.personalNumber')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.name')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.amount')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.days')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.normInterval')}</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {visiblePersons.length === 0 ?
            <Table.Row>
              <Table.Column>{t('family.empty')}</Table.Column>
            </Table.Row>
          : visiblePersons.map((person, index) =>
              editable ?
                <FamiljPersonRow
                  key={person.id ?? index}
                  errandId={errandId}
                  person={person}
                  normRows={normRows}
                  onAction={(action) => void runRowAction(action)}
                />
              : <ReadOnlyPersonRow key={person.id ?? index} person={person} />
            )
          }
        </Table.Body>
      </Table>
    </NormberakningTableBox>
  );
};
