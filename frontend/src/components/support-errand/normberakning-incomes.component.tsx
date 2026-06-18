'use client';

import { addNormRow, deleteNormRow, NormIncomeRow, restoreNormRow, updateNormRow } from '@services/normberakning-service';
import { Button, Input, Select, Table } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { FC, useState } from 'react';

import { NormberakningSummaBox } from './normberakning-summa-box.component';

const RECIPIENT_LABELS: Record<string, string> = { APPLICANT: 'Sökande', CO_APPLICANT: 'Medsökande' };

const parseAmount = (value: string): number | undefined => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const displayAmount = (value?: number): string => (value == null ? '—' : formatAmount(value));

interface NormberakningIncomesProps {
  errandId: string;
  rows: NormIncomeRow[];
  incomeSum?: number;
  onChanged: () => void;
}

/**
 * INKOMSTER section of the draft normberäkning. Each row is per (income type, recipient): the process
 * value is read-only (system/SSBTEK), the handläggare value + note are editable, and the effective value
 * is what the calculation uses. Handläggare can also add their own rows and soft-delete/restore rows.
 */
export const NormberakningIncomes: FC<NormberakningIncomesProps> = ({ errandId, rows, incomeSum, onChanged }) => {
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

  const saveRow = (row: NormIncomeRow, amount: string, date: string, note: string) => {
    void runRowAction(row.id ?? '', () =>
      updateNormRow(errandId, 'incomes', row.id ?? '', {
        handlaggareAmount: parseAmount(amount),
        handlaggareAmountDate: date.trim() || undefined,
        note: note.trim() || undefined,
      })
    );
  };

  return (
    <div className="flex flex-col gap-16 py-24">
      <NormberakningSummaBox label="Summa inkomster" value={displayAmount(incomeSum)} />

      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <Table dense background>
        <Table.Header>
          <Table.HeaderColumn>Typ</Table.HeaderColumn>
          <Table.HeaderColumn>Mottagare</Table.HeaderColumn>
          <Table.HeaderColumn>Process</Table.HeaderColumn>
          <Table.HeaderColumn>Handläggare</Table.HeaderColumn>
          <Table.HeaderColumn>Datum</Table.HeaderColumn>
          <Table.HeaderColumn>Effektivt</Table.HeaderColumn>
          <Table.HeaderColumn>Anmärkning</Table.HeaderColumn>
          <Table.HeaderColumn>
            <span className="sr-only">Åtgärder</span>
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ?
            <Table.Row>
              <Table.Column>Inga inkomstrader</Table.Column>
            </Table.Row>
          : rows.map((row, index) => (
              <IncomeRow
                key={row.id ?? index}
                row={row}
                saving={savingId === row.id}
                onSave={saveRow}
                onDelete={() => {
                  void runRowAction(row.id ?? '', () => deleteNormRow(errandId, 'incomes', row.id ?? ''));
                }}
                onRestore={() => {
                  void runRowAction(row.id ?? '', () => restoreNormRow(errandId, 'incomes', row.id ?? ''));
                }}
              />
            ))
          }
          <AddIncomeRow errandId={errandId} onAdded={onChanged} onError={setError} />
        </Table.Body>
      </Table>
    </div>
  );
};

/** A single editable income row (handläggare amount/date/note); process and effective are read-only. */
const IncomeRow: FC<{
  row: NormIncomeRow;
  saving: boolean;
  onSave: (row: NormIncomeRow, amount: string, date: string, note: string) => void;
  onDelete: () => void;
  onRestore: () => void;
}> = ({ row, saving, onSave, onDelete, onRestore }) => {
  const [amount, setAmount] = useState<string>(row.handlaggareAmount?.toString() ?? '');
  const [date, setDate] = useState<string>(row.handlaggareAmountDate ?? '');
  const [note, setNote] = useState<string>(row.note ?? '');

  const recipient = RECIPIENT_LABELS[row.recipient ?? ''] ?? row.recipient ?? '—';

  if (row.deleted) {
    return (
      <Table.Row className="opacity-50">
        <Table.Column>
          <span className="line-through">{row.typeName ?? 'Inkomst'}</span>
        </Table.Column>
        <Table.Column>{recipient}</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>
          <span className="italic">Borttagen</span>
        </Table.Column>
        <Table.Column>
          <Button size="sm" variant="tertiary" iconButton aria-label="Återställ rad" leftIcon={<RotateCcw />} onClick={onRestore} />
        </Table.Column>
      </Table.Row>
    );
  }

  const dirty =
    amount !== (row.handlaggareAmount?.toString() ?? '') ||
    date !== (row.handlaggareAmountDate ?? '') ||
    note !== (row.note ?? '');

  return (
    <Table.Row>
      <Table.Column>
        <span className="font-bold">{row.typeName ?? 'Inkomst'}</span>
      </Table.Column>
      <Table.Column>{recipient}</Table.Column>
      <Table.Column className="tabular-nums text-dark-secondary">{displayAmount(row.processAmount)}</Table.Column>
      <Table.Column>
        <Input
          size="sm"
          inputMode="decimal"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
          placeholder="ÅÅÅÅ-MM-DD"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
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
          <Button
            size="sm"
            variant="primary"
            color="vattjom"
            disabled={!dirty}
            loading={saving}
            onClick={() => {
              onSave(row, amount, date, note);
            }}
          >
            Spara
          </Button>
          <Button size="sm" variant="tertiary" iconButton aria-label="Ta bort rad" leftIcon={<Trash2 />} onClick={onDelete} />
        </div>
      </Table.Column>
    </Table.Row>
  );
};

/** The last table row for adding a handläggare income row. */
const AddIncomeRow: FC<{ errandId: string; onAdded: () => void; onError: (message: string) => void }> = ({
  errandId,
  onAdded,
  onError,
}) => {
  const [typeName, setTypeName] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('APPLICANT');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  const add = async () => {
    if (!typeName.trim()) {
      onError('Ange en inkomsttyp');
      return;
    }
    setAdding(true);
    const result = await addNormRow(errandId, 'incomes', {
      typeName: typeName.trim(),
      recipient,
      handlaggareAmount: parseAmount(amount),
      note: note.trim() || undefined,
    });
    setAdding(false);
    if (result.error) {
      onError('Det gick inte att lägga till raden');
      return;
    }
    setTypeName('');
    setAmount('');
    setNote('');
    onAdded();
  };

  return (
    <Table.Row>
      <Table.Column>
        <Input
          size="sm"
          placeholder="Inkomsttyp"
          value={typeName}
          onChange={(event) => {
            setTypeName(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>
        <Select
          size="sm"
          value={recipient}
          onChange={(event) => {
            setRecipient(event.target.value);
          }}
        >
          <Select.Option value="APPLICANT">Sökande</Select.Option>
          <Select.Option value="CO_APPLICANT">Medsökande</Select.Option>
        </Select>
      </Table.Column>
      <Table.Column>—</Table.Column>
      <Table.Column>
        <Input
          size="sm"
          inputMode="decimal"
          placeholder="Belopp"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>—</Table.Column>
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
