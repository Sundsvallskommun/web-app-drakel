'use client';

import { NormPersonRow } from '@services/normberakning-service';
import { Icon, Table } from '@sk-web-gui/react';
import { Check } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { NormberakningTableBox } from './normberakning-table-box.component';

const days = (value?: number): string => (value == null ? '—' : String(value));

/**
 * FAMILJ section of the draft normberäkning — the persons the norm covers. Read-only: adding persons
 * and umgängesbarn is handled in Lifecare, not here.
 */
export const NormberakningFamilj: FC<{ persons: NormPersonRow[] }> = ({ persons }) => {
  const { t } = useTranslation('calculation');
  const visiblePersons = persons.filter((person) => !person.deleted);

  return (
    <NormberakningTableBox title={t('family.title')}>
      <Table dense>
        <Table.Header>
          <Table.HeaderColumn>{t('family.included')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.name')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.role')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.includedFrom')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.includedTo')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.days')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.normInterval')}</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {visiblePersons.length === 0 ?
            <Table.Row>
              <Table.Column>{t('family.empty')}</Table.Column>
            </Table.Row>
          : visiblePersons.map((person, index) => (
              <Table.Row key={person.id ?? index}>
                <Table.Column>
                  {person.included ?
                    <Icon icon={<Check />} aria-label={t('family.included')} />
                  : <span className="sr-only">{t('family.notIncluded')}</span>}
                </Table.Column>
                <Table.Column>{person.name ?? '—'}</Table.Column>
                <Table.Column>{person.roleDisplayName ?? person.role ?? '—'}</Table.Column>
                <Table.Column>{person.deviationFromDate ?? '—'}</Table.Column>
                <Table.Column>{person.deviationToDate ?? '—'}</Table.Column>
                <Table.Column className="tabular-nums">{days(person.effectiveDays)}</Table.Column>
                <Table.Column>{person.normInterval ?? '—'}</Table.Column>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>
    </NormberakningTableBox>
  );
};
