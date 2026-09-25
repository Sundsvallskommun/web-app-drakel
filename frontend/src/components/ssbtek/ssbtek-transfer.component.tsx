'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { SsbtekTransferIncomeDtoRoleEnum } from '@data-contracts/backend/data-contracts';
import { useSsbtekChanges } from '@hooks/use-ssbtek-changes';
import { transferSsbtekIncomes } from '@services/ssbtek-service';
import { Button, Table } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { changeKey, SsbtekChangeRow } from './ssbtek-change-row.component';

/**
 * Överför till normberäkningen: the incomes SSBTEK reports that the errand's normberäkning in Lifecare lacks, per
 * income type and person, as careM compares them. The handläggare picks and transfers them at SSBTEK's amounts; careM
 * then keeps them from being transferred again. An income already in the normberäkning is shown, but cannot be picked.
 */
export const SsbtekTransfer: FC<{ errandId: string }> = ({ errandId }) => {
  const { t } = useTranslation('ssbtek');
  const { view, isLoading, error, errorMessage, refresh } = useSsbtekChanges(errandId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [transferring, setTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string>();
  const [transferredCount, setTransferredCount] = useState<number>();

  const picked = view.changes.filter((change) => change.transferable && selected.has(changeKey(change)));

  const toggle = (key: string): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const transfer = async (): Promise<void> => {
    setTransferring(true);
    setTransferError(undefined);
    setTransferredCount(undefined);
    const incomes = picked.flatMap((change) =>
      change.incomeTypeId === undefined ?
        []
      : [{ role: SsbtekTransferIncomeDtoRoleEnum[change.role], incomeTypeId: change.incomeTypeId }]
    );
    const result = await transferSsbtekIncomes(errandId, incomes);
    setTransferring(false);
    if (result.error) {
      setTransferError(result.message ?? t('transfer.error'));
      return;
    }
    setTransferredCount(incomes.length);
    setSelected(new Set());
    refresh();
  };

  return (
    <section className="flex flex-col gap-16" aria-label={t('transfer.title')}>
      <h2 className="text-h4-sm m-0">{t('transfer.title')}</h2>
      <AsyncContent
        isLoading={isLoading}
        error={error}
        errorText={errorMessage ?? t('transfer.loadError')}
        isEmpty={!view.available || view.changes.length === 0}
        emptyText={view.available ? t('transfer.inSync') : t('transfer.notAvailable')}
      >
        {view.isFinal ?
          <p className="m-0 text-small text-dark-secondary">{t('transfer.final')}</p>
        : null}
        <Table dense wrappingBorder>
          <Table.Header>
            <Table.HeaderColumn>
              <span className="sr-only">{t('transfer.columns.pick')}</span>
            </Table.HeaderColumn>
            <Table.HeaderColumn>{t('transfer.columns.incomeType')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('columns.person')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('transfer.columns.ssbtekAmount')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('transfer.columns.lifecareAmount')}</Table.HeaderColumn>
            <Table.HeaderColumn>{t('transfer.columns.status')}</Table.HeaderColumn>
          </Table.Header>
          <Table.Body>
            {view.changes.map((change) => (
              <SsbtekChangeRow
                key={`${changeKey(change)}:${change.kind}`}
                change={change}
                selected={selected.has(changeKey(change))}
                onToggle={() => {
                  toggle(changeKey(change));
                }}
              />
            ))}
          </Table.Body>
        </Table>
        <div className="flex flex-wrap items-center gap-16">
          <Button
            size="sm"
            color="vattjom"
            disabled={picked.length === 0}
            loading={transferring}
            onClick={() => void transfer()}
          >
            {t('transfer.submit', { count: picked.length })}
          </Button>
          {transferError ?
            <p className="m-0 text-error-surface-primary" role="alert">
              {transferError}
            </p>
          : null}
          {transferredCount ?
            <p className="m-0 text-success-surface-primary" role="status">
              {t('transfer.done', { count: transferredCount })}
            </p>
          : null}
        </div>
      </AsyncContent>
    </section>
  );
};
