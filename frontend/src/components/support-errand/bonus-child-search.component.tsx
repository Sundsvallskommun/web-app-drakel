'use client';

import { HouseholdCandidateView } from '@data-contracts/backend/data-contracts';
import { addBonusChild, findHouseholdCandidates } from '@services/lifecare-household-service';
import { Button, FormControl, FormLabel, Input } from '@sk-web-gui/react';
import { FC, SyntheticEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Lifecare searches on at least this many characters of a name or personnummer.
const MIN_FILTER_LENGTH = 2;

/**
 * "Lägg till bonusbarn": searches Lifecare's persons by name or personnummer and adds the one picked as a
 * bonusbarn to the sökandes hushåll, taking them into the normberäkning at the same time.
 */
export const BonusChildSearch: FC<{ errandId: string; disabled?: boolean; onAdded: () => void }> = ({
  errandId,
  disabled = false,
  onAdded,
}) => {
  const { t } = useTranslation('calculation');
  const [filter, setFilter] = useState<string>('');
  const [candidates, setCandidates] = useState<HouseholdCandidateView[]>();
  const [working, setWorking] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const search = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setWorking(true);
    setError(undefined);
    const result = await findHouseholdCandidates(errandId, filter.trim());
    setWorking(false);
    if (result.error || !result.data) {
      setError(result.message ?? t('household.searchError'));
      return;
    }
    setCandidates(result.data);
  };

  const add = async (candidate: HouseholdCandidateView): Promise<void> => {
    setWorking(true);
    setError(undefined);
    const result = await addBonusChild(errandId, candidate.personId);
    setWorking(false);
    if (result.error) {
      setError(result.message ?? t('household.addError'));
      return;
    }
    setCandidates(undefined);
    setFilter('');
    onAdded();
  };

  return (
    <div className="flex flex-col gap-12">
      <form className="flex items-end gap-12" onSubmit={(event) => void search(event)}>
        <FormControl className="w-[24rem]" disabled={disabled}>
          <FormLabel className="text-small">{t('household.addBonusChild')}</FormLabel>
          <Input
            size="sm"
            placeholder={t('household.searchPlaceholder')}
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
            }}
          />
        </FormControl>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          loading={working}
          disabled={disabled || filter.trim().length < MIN_FILTER_LENGTH}
        >
          {t('household.search')}
        </Button>
      </form>
      {error ?
        <p className="m-0 text-error-surface-primary">{error}</p>
      : null}
      {candidates?.length === 0 ?
        <p className="m-0 text-dark-secondary">{t('household.noCandidates')}</p>
      : null}
      {candidates && candidates.length > 0 ?
        <ul className="m-0 p-0 list-none flex flex-col gap-8">
          {candidates.map((candidate) => (
            <li key={candidate.personId} className="flex items-center gap-16">
              <span className="tabular-nums">{candidate.personalNumber}</span>
              <span>{candidate.name}</span>
              <Button size="sm" variant="tertiary" disabled={disabled || working} onClick={() => void add(candidate)}>
                {t('household.addAsBonusChild')}
              </Button>
            </li>
          ))}
        </ul>
      : null}
    </div>
  );
};
