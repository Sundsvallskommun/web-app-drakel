'use client';

import { ErrandEvent } from '@services/event-service';
import { Table } from '@sk-web-gui/react';
import { formatDateTime } from '@utils/date-time';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The events a logguppföljning turned up, newest first. Each row links to the errand it concerns, since
 * following up an access means looking at what was accessed.
 */
export const ActorLogResults: FC<{ events: ErrandEvent[] }> = ({ events }) => {
  const { t } = useTranslation('admin');
  const { locale } = useParams<{ locale: string }>();

  return (
    <Table dense background>
      <Table.Header>
        <Table.HeaderColumn>{t('logs.columns.time')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('logs.columns.action')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('logs.columns.source')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('logs.columns.target')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('logs.columns.errand')}</Table.HeaderColumn>
      </Table.Header>
      <Table.Body>
        {events.map((event, index) => (
          <Table.Row key={event.id ?? `${event.created ?? ''}-${index}`}>
            <Table.Column className="whitespace-nowrap">{formatDateTime(event.created) || '—'}</Table.Column>
            <Table.Column>
              {event.action ? t(`sidebar:events.actions.${event.action}`, { defaultValue: event.action }) : '—'}
            </Table.Column>
            <Table.Column>
              {event.source ? t(`sidebar:events.sources.${event.source}`, { defaultValue: event.source }) : '—'}
            </Table.Column>
            <Table.Column className="break-words">{event.description ?? event.target ?? '—'}</Table.Column>
            <Table.Column>
              {event.errandId ?
                <NextLink href={`/${locale}/arende/${event.errandId}`}>{t('logs.openErrand')}</NextLink>
              : '—'}
            </Table.Column>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};
