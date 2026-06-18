'use client';

import { NormExpenseRow } from '@services/normberakning-service';
import { Table } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import { FC } from 'react';

import { NormberakningSummaBox } from './normberakning-summa-box.component';

const amount = (value?: number): string => (value == null ? '—' : formatAmount(value));

/** The free-text specification when present, otherwise the cost-type code. */
const expenseLabel = (row: NormExpenseRow): string => {
  if (row.specification?.trim()) {
    return row.specification;
  }
  return row.costType ?? '—';
};

/**
 * UTGIFTER section of the draft normberäkning (read-only for now). Each expense carries the applied
 * amount, the system process amount, the handläggare amount and the resulting effective amount.
 */
export const NormberakningUtgifter: FC<{ rows: NormExpenseRow[]; expenseSum?: number }> = ({ rows, expenseSum }) => {
  const visibleRows = rows.filter((row) => !row.deleted);

  return (
    <div className="flex flex-col gap-16 py-24">
      <NormberakningSummaBox label="Summa utgifter" value={amount(expenseSum)} />

      <Table dense background>
        <Table.Header>
          <Table.HeaderColumn>Typ</Table.HeaderColumn>
          <Table.HeaderColumn>Ansökt</Table.HeaderColumn>
          <Table.HeaderColumn>Process</Table.HeaderColumn>
          <Table.HeaderColumn>Handläggare</Table.HeaderColumn>
          <Table.HeaderColumn>Effektivt</Table.HeaderColumn>
          <Table.HeaderColumn>Anmärkning</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {visibleRows.length === 0 ?
            <Table.Row>
              <Table.Column>Inga utgifter</Table.Column>
            </Table.Row>
          : visibleRows.map((row, index) => (
              <Table.Row key={row.id ?? index}>
                <Table.Column>{expenseLabel(row)}</Table.Column>
                <Table.Column className="tabular-nums">{amount(row.appliedAmount)}</Table.Column>
                <Table.Column className="tabular-nums">{amount(row.processAmount)}</Table.Column>
                <Table.Column className="tabular-nums">{amount(row.handlaggareAmount)}</Table.Column>
                <Table.Column className="tabular-nums">{amount(row.effectiveAmount)}</Table.Column>
                <Table.Column>{row.note ?? ''}</Table.Column>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>

      <p className="text-small text-dark-secondary m-0">
        Utgiftsraderna kommer från beräkningen. Redigering (handläggarbelopp) kan kopplas på när det behövs.
      </p>
    </div>
  );
};
