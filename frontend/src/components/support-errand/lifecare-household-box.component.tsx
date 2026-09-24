'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { useLifecareHousehold } from '@hooks/use-lifecare-household';
import { includeHouseholdPerson } from '@services/lifecare-household-service';
import { Button, Table } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BonusChildSearch } from './bonus-child-search.component';
import { NormberakningTableBox } from './normberakning-table-box.component';

/**
 * HUSHÅLL — the sökandes hushåll as Lifecare holds it, under the normberäkning's members. A member or bonusbarn
 * the beräkning leaves out can be taken in, and a new bonusbarn added. Only for a beräkning saved in Lifecare.
 */
export const LifecareHouseholdBox: FC<{ errandId: string; disabled?: boolean; onChanged: () => void }> = ({
  errandId,
  disabled = false,
  onChanged,
}) => {
  const { t } = useTranslation('calculation');
  const { household, isLoading, error, errorMessage, refresh } = useLifecareHousehold(errandId);
  const [working, setWorking] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const changed = (): void => {
    refresh();
    onChanged();
  };

  const includePerson = async (personId: string): Promise<void> => {
    setWorking(personId);
    setActionError(undefined);
    const result = await includeHouseholdPerson(errandId, personId);
    setWorking(undefined);
    if (result.error) {
      setActionError(result.message ?? t('household.includeError'));
      return;
    }
    changed();
  };

  return (
    <NormberakningTableBox title={t('household.title')}>
      {actionError ?
        <p className="m-0 text-error-surface-primary">{actionError}</p>
      : null}
      <AsyncContent
        isLoading={isLoading}
        error={error}
        errorText={errorMessage ?? t('household.loadError')}
        isEmpty={household.persons.length === 0}
        emptyText={t('household.empty')}
      >
        <Table dense>
          <Table.Header>
            <Table.HeaderColumn>{t('family.personalNumber')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('family.name')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('household.relation')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('household.inCalculation')}</Table.HeaderColumn>
          </Table.Header>
          <Table.Body>
            {household.persons.map((person) => (
              <Table.Row key={person.personId}>
                <Table.Column className="tabular-nums">{person.personalNumber}</Table.Column>
                <Table.Column>{person.name}</Table.Column>
                <Table.Column>{person.bonusChild ? t('household.bonusChild') : (person.relation ?? '—')}</Table.Column>
                <Table.Column>
                  {person.inCalculation ?
                    t('household.included')
                  : <Button
                      size="sm"
                      variant="tertiary"
                      loading={working === person.personId}
                      disabled={disabled || working !== undefined}
                      onClick={() => void includePerson(person.personId)}
                    >
                      {t('household.include')}
                    </Button>
                  }
                </Table.Column>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </AsyncContent>
      <BonusChildSearch errandId={errandId} disabled={disabled} onAdded={changed} />
    </NormberakningTableBox>
  );
};
