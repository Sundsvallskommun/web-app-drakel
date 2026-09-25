'use client';

import { SsbtekIncomeChangeView, SsbtekIncomeChangeViewKindEnum } from '@data-contracts/backend/data-contracts';
import { Checkbox, Table } from '@sk-web-gui/react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { SsbtekAmount } from './ssbtek-amount.component';

/** An income as the transfer picks it: whose, of which type. */
export const changeKey = (change: SsbtekIncomeChangeView): string =>
  `${change.role}:${String(change.incomeTypeId ?? '')}`;

/**
 * One income on which SSBTEK and the normberäkning disagree. Only one the normberäkning lacks can be picked for
 * transfer; one already there says how it differs, and cannot be transferred again.
 */
export const SsbtekChangeRow: FC<{
  change: SsbtekIncomeChangeView;
  selected: boolean;
  onToggle: () => void;
}> = ({ change, selected, onToggle }) => {
  const { t } = useTranslation('ssbtek');
  const status =
    change.transferable ? 'missing'
    : change.kind === SsbtekIncomeChangeViewKindEnum.ADD ? 'notTransferable'
    : change.kind.toLowerCase();
  const label = t('transfer.pick', { incomeType: change.incomeType, person: t(`persons.${change.role}`) });

  return (
    <Table.Row>
      <Table.Column>
        {change.transferable ?
          <Checkbox checked={selected} onChange={onToggle} aria-label={label} />
        : null}
      </Table.Column>
      <Table.Column>{change.incomeType}</Table.Column>
      <Table.Column>{t(`persons.${change.role}`)}</Table.Column>
      <Table.Column>
        <SsbtekAmount amount={change.ssbtekAmount} />
      </Table.Column>
      <Table.Column>
        <SsbtekAmount amount={change.lifecareAmount} />
      </Table.Column>
      <Table.Column>{t(`transfer.status.${status}`)}</Table.Column>
    </Table.Row>
  );
};
