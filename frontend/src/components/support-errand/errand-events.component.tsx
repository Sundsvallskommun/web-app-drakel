'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { useErrandEvents } from '@hooks/use-errand-events';
import { ErrandEvent } from '@services/event-service';
import { Button, Select } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

// The log can be long (it records every errand-scoped request), so reveal it in pages.
const PAGE_SIZE = 50;

// The action codes the log can be filtered on; their labels are the translation keys `sidebar:events.actions.<code>`.
const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'];

const actionChipClass = (action?: string): string => {
  switch (action) {
    case 'CREATE':
      return 'bg-success-background-100 text-success-surface-primary';
    case 'UPDATE':
      return 'bg-vattjom-background-200 text-vattjom-text-primary';
    case 'DELETE':
      return 'bg-error-background-100 text-error-surface-primary';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

// HTTP = the access log (who read/touched), EVENT = the domain-event change log (what changed, incl. process/system).
const SOURCES = ['HTTP', 'EVENT'];

const formatWhen = (created?: string): string | undefined =>
  created ? dayjs(created).format('YYYY-MM-DD HH:mm') : undefined;

/**
 * "Händelselogg" — the errand's who/what/when activity log (reads + writes), newest first. Rendered as a
 * compact card list (with stacked filters) so it fits the right sidebar.
 */
export const ErrandEvents: FC<{ errandId: string }> = ({ errandId }) => {
  const { t } = useTranslation('sidebar');
  const [action, setAction] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const { events, isLoading, error } = useErrandEvents(errandId, action || undefined, source || undefined);

  const visible = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  const actionLabel = (eventAction?: string): string =>
    eventAction ? t(`events.actions.${eventAction}`, { defaultValue: eventAction }) : t('common:none');
  const sourceLabel = (eventSource?: string): string =>
    eventSource ? t(`events.sources.${eventSource}`, { defaultValue: eventSource }) : '';
  // actor is null when no X-Sent-By header was sent on the originating request.
  const actorLabel = (event: ErrandEvent): string => (event.actor?.trim() ? event.actor : t('events.system'));

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-8">
        <Select
          size="sm"
          className="w-full"
          aria-label={t('events.filterSource')}
          value={source}
          onChange={(changeEvent) => {
            setSource(changeEvent.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <Select.Option value="">{t('events.allSources')}</Select.Option>
          {SOURCES.map((sourceOption) => (
            <Select.Option key={sourceOption} value={sourceOption}>
              {t(`events.sourceOptions.${sourceOption}`)}
            </Select.Option>
          ))}
        </Select>
        <Select
          size="sm"
          className="w-full"
          aria-label={t('events.filterAction')}
          value={action}
          onChange={(changeEvent) => {
            setAction(changeEvent.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <Select.Option value="">{t('events.allActions')}</Select.Option>
          {ACTIONS.map((actionOption) => (
            <Select.Option key={actionOption} value={actionOption}>
              {t(`events.actions.${actionOption}`)}
            </Select.Option>
          ))}
        </Select>
      </div>

      <AsyncContent
        isLoading={isLoading}
        error={error}
        errorText={t('events.loadError')}
        isEmpty={events.length === 0}
        emptyText={t('events.empty')}
      >
        <ul className="flex flex-col gap-8 m-0 p-0 list-none">
          {visible.map((event, index) => (
            <li key={event.id ?? index} className="rounded-12 border-1 border-divider p-12 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-8">
                <span className={`inline-block text-small rounded-8 px-8 py-2 ${actionChipClass(event.action)}`}>
                  {actionLabel(event.action)}
                </span>
                {sourceLabel(event.source) ?
                  <span className="text-small text-dark-secondary shrink-0">{sourceLabel(event.source)}</span>
                : null}
              </div>
              {event.target ?
                <span className="text-small break-words">{event.target}</span>
              : null}
              <span className="text-small text-dark-secondary break-words">
                {actorLabel(event)} · {formatWhen(event.created) ?? t('common:none')}
              </span>
            </li>
          ))}
        </ul>
        {hasMore ?
          <Button
            size="sm"
            variant="secondary"
            className="self-center"
            onClick={() => {
              setVisibleCount((prev) => prev + PAGE_SIZE);
            }}
          >
            {t('events.showMore')}
          </Button>
        : null}
      </AsyncContent>
    </div>
  );
};
