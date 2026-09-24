'use client';

import { useResizableHeight } from '@hooks/use-resizable-height';
import { Button, DatePicker, FormControl, FormLabel, Select, Table } from '@sk-web-gui/react';
import { displayAmount } from '@utils/format-amount';
import { Download, X } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { SSBTEK_MOCK_ROWS } from './ssbtek-mock-data';
import { useSsbtekPanel } from './ssbtek-panel-context';

// The panel opens a third of the way up and is dragged between a strip and most of the screen.
const INITIAL_HEIGHT = 360;
const MIN_HEIGHT = 160;
const MAX_SHARE_OF_SCREEN = 0.85;

/**
 * "Hämta från SSBTEK" — a panel pinned to the foot of the page, across the whole width up to the right-hand
 * sidebar (whose width the errand view publishes as `--errand-sidebar-width`), resized by dragging its top edge.
 *
 * TODO(ssbtek): MOCK — only the look. Nothing is fetched from SSBTEK: the Hämta button is inactive and the rows
 * are made up (ssbtek-mock-data).
 */
export const SsbtekPanel: FC = () => {
  const { t } = useTranslation('ssbtek');
  const { isOpen, close } = useSsbtekPanel();
  const { height, startResize } = useResizableHeight(INITIAL_HEIGHT, MIN_HEIGHT, MAX_SHARE_OF_SCREEN);

  if (!isOpen) {
    return null;
  }

  return (
    <section
      aria-label={t('title')}
      className="fixed bottom-0 left-0 z-30 flex flex-col bg-background-content border-t-1 border-divider shadow-100"
      style={{ height, right: 'var(--errand-sidebar-width, 0px)' }}
    >
      {/* The drag handle: the panel's top edge. */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={t('resize')}
        className="h-12 shrink-0 cursor-row-resize flex items-center justify-center hover:bg-background-200"
        onPointerDown={startResize}
      >
        <span className="block w-48 h-4 rounded-full bg-dark-disabled" />
      </div>

      <div className="flex items-center justify-between gap-16 px-24 pb-12 shrink-0">
        <div className="flex items-center gap-12">
          <h2 className="text-h4-sm m-0">{t('title')}</h2>
          <span className="text-small rounded-8 px-8 py-2 bg-warning-background-100 text-warning-surface-primary">
            {t('mockBadge')}
          </span>
        </div>
        <Button size="sm" variant="tertiary" iconButton aria-label={t('close')} leftIcon={<X />} onClick={close} />
      </div>

      <div className="grow min-h-0 overflow-y-auto px-24 pb-24 flex flex-col gap-16">
        <div className="flex flex-wrap items-end gap-16">
          <FormControl id="ssbtek-person" className="w-[20rem]">
            <FormLabel className="text-small">{t('person')}</FormLabel>
            <Select size="sm" defaultValue="APPLICANT">
              <Select.Option value="APPLICANT">{t('applicant')}</Select.Option>
              <Select.Option value="CO_APPLICANT">{t('coApplicant')}</Select.Option>
            </Select>
          </FormControl>
          <FormControl id="ssbtek-from" className="w-[16rem]">
            <FormLabel className="text-small">{t('from')}</FormLabel>
            <DatePicker size="sm" defaultValue="2026-09-01" />
          </FormControl>
          <FormControl id="ssbtek-to" className="w-[16rem]">
            <FormLabel className="text-small">{t('to')}</FormLabel>
            <DatePicker size="sm" defaultValue="2026-09-30" />
          </FormControl>
          <Button size="sm" color="vattjom" variant="primary" leftIcon={<Download />} disabled>
            {t('fetch')}
          </Button>
        </div>

        <Table dense background>
          <Table.Header>
            <Table.HeaderColumn>{t('columns.source')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.type')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.period')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.amount')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.status')}</Table.HeaderColumn>
          </Table.Header>
          <Table.Body>
            {SSBTEK_MOCK_ROWS.map((row) => (
              <Table.Row key={`${row.source}-${row.type}`}>
                <Table.Column>{row.source}</Table.Column>
                <Table.Column>{row.type}</Table.Column>
                <Table.Column className="tabular-nums">{row.period}</Table.Column>
                <Table.Column className="tabular-nums">{row.amount > 0 ? displayAmount(row.amount) : '—'}</Table.Column>
                <Table.Column>{row.status}</Table.Column>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </section>
  );
};
