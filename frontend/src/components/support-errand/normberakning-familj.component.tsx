'use client';

import { NormPersonRow } from '@services/normberakning-service';
import { Icon, Table } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import { Check } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FamiljPersonRow } from './familj-person-row.component';
import { NormberakningTableBox } from './normberakning-table-box.component';

const days = (value?: number): string => (value == null ? '—' : String(value));
const displayAmount = (value?: number): string => (value == null ? '—' : formatAmount(value));

/** A member of careM's draft, as the ansökan gave it — shown, not changed. */
const ReadOnlyPersonRow: FC<{ person: NormPersonRow }> = ({ person }) => {
  const { t } = useTranslation('calculation');
  return (
    <Table.Row>
      <Table.Column>
        {person.included ?
          <Icon icon={<Check />} aria-label={t('family.included')} />
        : <span className="sr-only">{t('family.notIncluded')}</span>}
      </Table.Column>
      <Table.Column className="tabular-nums">{person.personalNumber ?? '—'}</Table.Column>
      <Table.Column>{person.name ?? '—'}</Table.Column>
      <Table.Column className="tabular-nums">{displayAmount(person.amount)}</Table.Column>
      <Table.Column>{person.deviationFromDate ?? '—'}</Table.Column>
      <Table.Column>{person.deviationToDate ?? '—'}</Table.Column>
      <Table.Column className="tabular-nums">{days(person.effectiveDays)}</Table.Column>
      <Table.Column>{person.normInterval ?? '—'}</Table.Column>
    </Table.Row>
  );
};

/**
 * FAMILJ section of the normberäkning — the persons the norm covers. Read-only while the rows are careM's
 * draft; once the beräkning is saved in Lifecare (`editable`), whether each member is in it and the dates they
 * are can be changed there, and anyone but the sökande taken out.
 */
export const NormberakningFamilj: FC<{
  persons: NormPersonRow[];
  errandId: string;
  editable?: boolean;
  onChanged?: () => void;
}> = ({ persons, errandId, editable = false, onChanged }) => {
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
          <Table.HeaderColumn>{t('family.included')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.personalNumber')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.name')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.amount')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.includedFrom')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.includedTo')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.days')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.normInterval')}</Table.HeaderColumn>
          {editable ?
            <Table.HeaderColumn>
              <span className="sr-only">{t('table.actions')}</span>
            </Table.HeaderColumn>
          : null}
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
                  removable={index > 0}
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
