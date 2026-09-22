'use client';

import { useAdministrators } from '@hooks/use-administrators';
import { ActorEventLog, getActorEvents } from '@services/event-service';
import { Alert } from '@sk-web-gui/alert';
import { combineDateAndTime } from '@utils/date-time';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActorLogResults } from './actor-log-results.component';
import { ActorLogSearch, ActorLogSearchValues, emptyActorLogSearch } from './actor-log-search.component';

/** The whole day is meant when a date is picked, so the upper bound runs to the last minute of it. */
const END_OF_DAY = '23:59';

/**
 * "Logguppföljning" — what one handläggare has read and changed, across every errand.
 *
 * Nothing is looked up until Sök is pressed: the endpoint takes one actor, so there is no list to show
 * before a handläggare is chosen. caremanagement caps the listing, so the result says how many events
 * matched in all and points out when more were found than could be shown.
 */
export const ActorLogPageClient = () => {
  const { t } = useTranslation('admin');
  const { administrators } = useAdministrators();

  const [values, setValues] = useState<ActorLogSearchValues>(emptyActorLogSearch);
  const [searching, setSearching] = useState<boolean>(false);
  const [result, setResult] = useState<ActorEventLog>();
  const [searchedActor, setSearchedActor] = useState<string>();
  const [error, setError] = useState<string>();

  const search = async (): Promise<void> => {
    if (values.actor === '') {
      return;
    }
    setSearching(true);
    setError(undefined);
    const response = await getActorEvents({
      actor: values.actor,
      action: values.action || undefined,
      source: values.source || undefined,
      from: values.from ? combineDateAndTime(values.from) : undefined,
      to: values.to ? combineDateAndTime(values.to, END_OF_DAY) : undefined,
    });
    setSearching(false);
    if (response.error || !response.data) {
      setResult(undefined);
      setError(t('logs.error'));
      return;
    }
    setResult(response.data);
    setSearchedActor(values.actor);
  };

  const actorName =
    administrators.find((administrator) => administrator.username === searchedActor)?.displayName ?? searchedActor;
  const truncated = result !== undefined && result.total > result.events.length;

  return (
    <div className="flex flex-col gap-24">
      <p className="m-0 text-dark-secondary">{t('logs.intro')}</p>

      <ActorLogSearch
        values={values}
        onChange={setValues}
        administrators={administrators}
        onSearch={() => void search()}
        searching={searching}
      />

      {error ?
        <p className="m-0 text-error-surface-primary" role="alert">
          {error}
        </p>
      : null}

      {result ?
        <div className="flex flex-col gap-16">
          <p className="m-0 text-dark-secondary">
            {t('logs.showing', { shown: result.events.length, total: result.total, actor: actorName })}
          </p>

          {truncated ?
            <Alert type="warning">
              <Alert.Icon />
              <Alert.Content>
                <Alert.Content.Description>{t('logs.truncated')}</Alert.Content.Description>
              </Alert.Content>
            </Alert>
          : null}

          {result.events.length === 0 ?
            <p className="m-0 text-dark-secondary">{t('logs.empty')}</p>
          : <ActorLogResults events={result.events} />}
        </div>
      : null}
    </div>
  );
};
