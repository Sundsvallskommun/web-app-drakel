'use client';

import { NormPersonRow } from '@services/normberakning-service';
import { Button, Icon, Table } from '@sk-web-gui/react';
import { Check, Plus } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { NormberakningTableBox } from './normberakning-table-box.component';

const days = (value?: number): string => (value == null ? '—' : String(value));

/**
 * FAMILJ section of the draft normberäkning — the persons the norm covers (read-only for now). The
 * "Lägg till"-actions are visual placeholders until per-row person editing is wired.
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
                <Table.Column>
                  {person.role ? t(`common:role.${person.role}`, { defaultValue: person.role }) : '—'}
                </Table.Column>
                <Table.Column>{person.deviationFromDate ?? '—'}</Table.Column>
                <Table.Column>{person.deviationToDate ?? '—'}</Table.Column>
                <Table.Column className="tabular-nums">{days(person.effectiveDays)}</Table.Column>
                <Table.Column>{person.normInterval ?? '—'}</Table.Column>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>

      <div className="flex flex-wrap gap-12">
        <Button size="sm" variant="secondary" leftIcon={<Plus />} disabled>
          {t('family.addPerson')}
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<Plus />} disabled>
          {t('family.addVisitationChild')}
        </Button>
      </div>

      <p className="text-small text-dark-secondary m-0">{t('family.editingInfo')}</p>
    </NormberakningTableBox>
  );
};
