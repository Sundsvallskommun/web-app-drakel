'use client';

import { addNormRow, deleteNormRow, NormExpenseRow, restoreNormRow, TypeOption, updateNormRow } from '@services/normberakning-service';
import { Button, Input, Select, Table } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { FC, useState } from 'react';

import { NormberakningSummaBox } from './normberakning-summa-box.component';

const parseAmount = (value: string): number | undefined => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const displayAmount = (value?: number): string => (value == null ? '—' : formatAmount(value));

const expenseLabel = (row: NormExpenseRow, typeLabels: Record<string, string>): string => {
  if (row.specification?.trim()) {
    return row.specification;
  }
  const code = row.costType ?? '';
  return typeLabels[code] ?? (code || '—');
};

interface NormberakningExpensesProps {
  errandId: string;
  rows: NormExpenseRow[];
  sum?: number;
  summaLabel: string;
  /** Which expense bucket new rows are added to. */
  bucket: 'EXPENSE' | 'SPECIAL_EXPENSE';
  /** The labelled cost-type catalogue for this bucket (add-row dropdown + row labels). */
  types: TypeOption[];
  onChanged: () => void;
}

/**
 * UTGIFTER (bucket EXPENSE) and LEVNADSKOSTNADER I ÖVRIGT (bucket SPECIAL_EXPENSE) share the same shape
 * — applied / process / handläggare / effective amounts. The handläggare amount + note are editable.
 */
export const NormberakningExpenses: FC<NormberakningExpensesProps> = ({
  errandId,
  rows,
  sum,
  summaLabel,
  bucket,
  types,
  onChanged,
}) => {
  const typeLabels: Record<string, string> = {};
  for (const type of types) {
    if (type.code) {
      typeLabels[type.code] = type.displayName ?? type.code;
    }
  }
  const [savingId, setSavingId] = useState<string>();
  const [error, setError] = useState<string>();

  const runRowAction = async (rowId: string, action: () => Promise<{ error?: unknown }>) => {
    setSavingId(rowId);
    setError(undefined);
    const result = await action();
    setSavingId(undefined);
    if (result.error) {
      setError('Det gick inte att spara ändringen');
      return;
    }
    onChanged();
  };

  return (
    <div className="flex flex-col gap-16 py-24">
      <NormberakningSummaBox label={summaLabel} value={displayAmount(sum)} />

      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <Table dense background>
        <Table.Header>
          <Table.HeaderColumn>Typ</Table.HeaderColumn>
          <Table.HeaderColumn>Ansökt</Table.HeaderColumn>
          <Table.HeaderColumn>Process</Table.HeaderColumn>
          <Table.HeaderColumn>Handläggare</Table.HeaderColumn>
          <Table.HeaderColumn>Effektivt</Table.HeaderColumn>
          <Table.HeaderColumn>Anmärkning</Table.HeaderColumn>
          <Table.HeaderColumn>
            <span className="sr-only">Åtgärder</span>
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ?
            <Table.Row>
              <Table.Column>Inga rader</Table.Column>
            </Table.Row>
          : rows.map((row, index) => (
              <ExpenseRow
                key={row.id ?? index}
                errandId={errandId}
                row={row}
                typeLabels={typeLabels}
                saving={savingId === row.id}
                onAction={(rowId, action) => void runRowAction(rowId, action)}
              />
            ))
          }
          <AddExpenseRow errandId={errandId} bucket={bucket} types={types} onAdded={onChanged} onError={setError} />
        </Table.Body>
      </Table>
    </div>
  );
};

/** A single editable expense row (handläggare amount + note); applied/process/effective are read-only. */
const ExpenseRow: FC<{
  errandId: string;
  row: NormExpenseRow;
  typeLabels: Record<string, string>;
  saving: boolean;
  onAction: (rowId: string, action: () => Promise<{ error?: unknown }>) => void;
}> = ({ errandId, row, typeLabels, saving, onAction }) => {
  const [amount, setAmount] = useState<string>(row.caseworkerAmount?.toString() ?? '');
  const [note, setNote] = useState<string>(row.note ?? '');
  const rowId = row.id ?? '';

  if (row.deleted) {
    return (
      <Table.Row className="opacity-50">
        <Table.Column>
          <span className="line-through">{expenseLabel(row, typeLabels)}</span>
        </Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>
          <span className="italic">Borttagen</span>
        </Table.Column>
        <Table.Column>
          <Button
            size="sm"
            variant="tertiary"
            iconButton
            aria-label="Återställ rad"
            leftIcon={<RotateCcw />}
            onClick={() => {
              onAction(rowId, () => restoreNormRow(errandId, 'expenses', rowId));
            }}
          />
        </Table.Column>
      </Table.Row>
    );
  }

  const dirty = amount !== (row.caseworkerAmount?.toString() ?? '') || note !== (row.note ?? '');

  const save = () => {
    onAction(rowId, () =>
      updateNormRow(errandId, 'expenses', rowId, {
        caseworkerAmount: parseAmount(amount),
        note: note.trim() || undefined,
      })
    );
  };

  return (
    <Table.Row>
      <Table.Column>
        <span className="font-bold">{expenseLabel(row, typeLabels)}</span>
      </Table.Column>
      <Table.Column className="tabular-nums text-dark-secondary">{displayAmount(row.appliedAmount)}</Table.Column>
      <Table.Column className="tabular-nums text-dark-secondary">{displayAmount(row.processAmount)}</Table.Column>
      <Table.Column>
        <Input
          size="sm"
          inputMode="decimal"
          className="max-w-[9rem]"
          placeholder={displayAmount(row.processAmount)}
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column className="tabular-nums font-bold">{displayAmount(row.effectiveAmount)}</Table.Column>
      <Table.Column>
        <Input
          size="sm"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>
        <div className="flex gap-4">
          <Button size="sm" variant="primary" color="vattjom" disabled={!dirty} loading={saving} onClick={save}>
            Spara
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            iconButton
            aria-label="Ta bort rad"
            leftIcon={<Trash2 />}
            onClick={() => {
              onAction(rowId, () => deleteNormRow(errandId, 'expenses', rowId));
            }}
          />
        </div>
      </Table.Column>
    </Table.Row>
  );
};

/** The last table row for adding a handläggare expense row (costType picked from the catalogue). */
const AddExpenseRow: FC<{
  errandId: string;
  bucket: 'EXPENSE' | 'SPECIAL_EXPENSE';
  types: TypeOption[];
  onAdded: () => void;
  onError: (message: string) => void;
}> = ({ errandId, bucket, types, onAdded, onError }) => {
  const [costType, setCostType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  const add = async () => {
    if (!costType) {
      onError('Välj en typ');
      return;
    }
    setAdding(true);
    const result = await addNormRow(errandId, 'expenses', {
      bucket,
      costType,
      caseworkerAmount: parseAmount(amount),
      note: note.trim() || undefined,
    });
    setAdding(false);
    if (result.error) {
      onError('Det gick inte att lägga till raden');
      return;
    }
    setCostType('');
    setAmount('');
    setNote('');
    onAdded();
  };

  return (
    <Table.Row>
      <Table.Column>
        <Select
          size="sm"
          className="max-w-[16rem]"
          value={costType}
          onChange={(event) => {
            setCostType(event.target.value);
          }}
        >
          <Select.Option value="">Välj typ</Select.Option>
          {types.map((type) => (
            <Select.Option key={type.code} value={type.code ?? ''}>
              {type.displayName ?? type.code}
            </Select.Option>
          ))}
        </Select>
      </Table.Column>
      <Table.Column>—</Table.Column>
      <Table.Column>—</Table.Column>
      <Table.Column>
        <Input
          size="sm"
          inputMode="decimal"
          className="max-w-[9rem]"
          placeholder="Belopp"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>—</Table.Column>
      <Table.Column>
        <Input
          size="sm"
          placeholder="Anmärkning"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>
        <Button size="sm" variant="secondary" leftIcon={<Plus />} loading={adding} onClick={() => void add()}>
          Lägg till
        </Button>
      </Table.Column>
    </Table.Row>
  );
};
