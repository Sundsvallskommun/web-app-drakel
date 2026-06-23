'use client';

import { useErrandEvents } from '@hooks/use-errand-events';
import { ErrandEvent } from '@services/event-service';
import { Button, Select, Spinner, Table } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { FC, useState } from 'react';

// The log can be long (it records every errand-scoped request), so reveal it in pages.
const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  READ: 'Läst',
  CREATE: 'Skapad',
  UPDATE: 'Ändrad',
  DELETE: 'Borttagen',
};

const actionLabel = (action?: string): string => (action ? (ACTION_LABELS[action] ?? action) : '—');

// HTTP = the access log (who read/touched), EVENT = the domain-event change log (what changed, incl. process/system).
const SOURCE_LABELS: Record<string, string> = {
  HTTP: 'Åtkomst',
  EVENT: 'Ändring',
};

const sourceLabel = (source?: string): string => (source ? (SOURCE_LABELS[source] ?? source) : '—');

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

// actor is null when no X-Sent-By header was sent on the originating request.
const actorLabel = (event: ErrandEvent): string => (event.actor?.trim() ? event.actor : 'System');
const formatWhen = (created?: string): string => (created ? dayjs(created).format('YYYY-MM-DD HH:mm') : '—');

/** "Händelselogg" tab — the errand's who/what/when activity log (reads + writes), newest first. */
export const ErrandEvents: FC<{ errandId: string }> = ({ errandId }) => {
  const [action, setAction] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const { events, isLoading, error } = useErrandEvents(errandId, action || undefined, source || undefined);

  const visible = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  return (
    <div className="flex flex-col gap-16 max-w-[64rem]">
      <div className="flex items-center justify-between gap-12 flex-wrap">
        <h2 className="text-h3-sm md:text-h3-md m-0">Händelselogg</h2>
        <div className="flex items-center gap-8 flex-wrap">
          <Select
            size="sm"
            className="max-w-[16rem]"
            aria-label="Filtrera på källa"
            value={source}
            onChange={(changeEvent) => {
              setSource(changeEvent.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <Select.Option value="">Alla källor</Select.Option>
            <Select.Option value="HTTP">Åtkomst (vem läste/rörde)</Select.Option>
            <Select.Option value="EVENT">Ändringar (vad ändrades)</Select.Option>
          </Select>
          <Select
            size="sm"
            className="max-w-[14rem]"
            aria-label="Filtrera på händelse"
            value={action}
            onChange={(changeEvent) => {
              setAction(changeEvent.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <Select.Option value="">Alla händelser</Select.Option>
            <Select.Option value="READ">Läst</Select.Option>
            <Select.Option value="CREATE">Skapad</Select.Option>
            <Select.Option value="UPDATE">Ändrad</Select.Option>
            <Select.Option value="DELETE">Borttagen</Select.Option>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-error-surface-primary m-0">Det gick inte att hämta händelseloggen ({String(error)})</p>
      )}

      {isLoading ?
        <Spinner size={4} />
      : events.length === 0 ?
        <p className="m-0 text-dark-secondary">Inga händelser.</p>
      : <>
          <Table dense background>
            <Table.Header>
              <Table.HeaderColumn>Tidpunkt</Table.HeaderColumn>
              <Table.HeaderColumn>Källa</Table.HeaderColumn>
              <Table.HeaderColumn>Händelse</Table.HeaderColumn>
              <Table.HeaderColumn>Vad</Table.HeaderColumn>
              <Table.HeaderColumn>Vem</Table.HeaderColumn>
            </Table.Header>
            <Table.Body>
              {visible.map((event, index) => (
                <Table.Row key={event.id ?? index}>
                  <Table.Column className="whitespace-nowrap tabular-nums text-dark-secondary">
                    {formatWhen(event.created)}
                  </Table.Column>
                  <Table.Column className="whitespace-nowrap text-dark-secondary">{sourceLabel(event.source)}</Table.Column>
                  <Table.Column>
                    <span className={`inline-block text-small rounded-8 px-8 py-2 ${actionChipClass(event.action)}`}>
                      {actionLabel(event.action)}
                    </span>
                  </Table.Column>
                  <Table.Column className="break-words">{event.target ?? '—'}</Table.Column>
                  <Table.Column>
                    {actorLabel(event)}
                    {event.actor?.trim() && event.actorType ?
                      <span className="text-small text-dark-secondary"> ({event.actorType})</span>
                    : null}
                  </Table.Column>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {hasMore ?
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setVisibleCount((prev) => prev + PAGE_SIZE);
                }}
              >
                Visa fler
              </Button>
            </div>
          : null}
        </>
      }
    </div>
  );
};
