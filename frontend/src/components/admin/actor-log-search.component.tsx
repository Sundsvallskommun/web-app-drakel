'use client';

import { FormField } from '@components/common/form-field.component';
import { Administrator } from '@services/administrator-service';
import { Button, DatePicker, Select } from '@sk-web-gui/react';
import { Search } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/** What a logguppföljning is searched on, as the form holds it (dates as yyyy-MM-dd). */
export interface ActorLogSearchValues {
  actor: string;
  action: string;
  source: string;
  from: string;
  to: string;
}

export const emptyActorLogSearch: ActorLogSearchValues = { actor: '', action: '', source: '', from: '', to: '' };

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'];
const SOURCES = ['HTTP', 'EVENT'];

/**
 * The search form for one handläggare's activity. Nothing is looked up until Sök is pressed, and a
 * handläggare has to be chosen first — the endpoint takes an actor and there is no "everyone" listing.
 */
export const ActorLogSearch: FC<{
  values: ActorLogSearchValues;
  onChange: (values: ActorLogSearchValues) => void;
  administrators: Administrator[];
  onSearch: () => void;
  searching: boolean;
}> = ({ values, onChange, administrators, onSearch, searching }) => {
  const { t } = useTranslation('admin');

  const set = (key: keyof ActorLogSearchValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="flex flex-col gap-16 rounded-16 bg-background-content p-24">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
        <FormField label={t('logs.actor')} required>
          <Select
            className="w-full"
            value={values.actor}
            onChange={(event) => {
              set('actor', event.target.value);
            }}
          >
            <Select.Option value="">{t('logs.selectActor')}</Select.Option>
            {administrators.map((administrator) => (
              <Select.Option key={administrator.username} value={administrator.username}>
                {administrator.displayName}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        <FormField label={t('logs.action')}>
          <Select
            className="w-full"
            value={values.action}
            onChange={(event) => {
              set('action', event.target.value);
            }}
          >
            <Select.Option value="">{t('sidebar:events.allActions')}</Select.Option>
            {ACTIONS.map((action) => (
              <Select.Option key={action} value={action}>
                {t(`sidebar:events.actions.${action}`, { defaultValue: action })}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        <FormField label={t('logs.source')}>
          <Select
            className="w-full"
            value={values.source}
            onChange={(event) => {
              set('source', event.target.value);
            }}
          >
            <Select.Option value="">{t('sidebar:events.allSources')}</Select.Option>
            {SOURCES.map((source) => (
              <Select.Option key={source} value={source}>
                {t(`sidebar:events.sourceOptions.${source}`, { defaultValue: source })}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        <FormField label={t('logs.from')}>
          <DatePicker
            type="date"
            value={values.from}
            onChange={(event) => {
              set('from', event.target.value);
            }}
          />
        </FormField>

        <FormField label={t('logs.to')}>
          <DatePicker
            type="date"
            value={values.to}
            onChange={(event) => {
              set('to', event.target.value);
            }}
          />
        </FormField>
      </div>

      <div>
        <Button
          color="vattjom"
          variant="primary"
          leftIcon={<Search />}
          loading={searching}
          disabled={values.actor === ''}
          onClick={onSearch}
        >
          {t('logs.search')}
        </Button>
      </div>
    </div>
  );
};
