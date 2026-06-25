'use client';

import { addNormRow, deleteNormRow, NormExpenseRow, restoreNormRow, TypeOption, updateNormRow } from '@services/normberakning-service';
import { Button, FormControl, FormLabel, Input, Select, Spinner, Table } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import { RotateCcw, Trash2 } from 'lucide-react';
import { FC, FocusEvent, useState } from 'react';

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
  const [error, setError] = useState<string>();
  // Draft rows: picking a type below the table adds a not-yet-persisted row to the list. It's created
  // once the handläggare fills it in and focus leaves the row (see DraftExpenseRow).
  const [drafts, setDrafts] = useState<{ key: number; costType: string }[]>([]);
  const [draftSeq, setDraftSeq] = useState<number>(0);

  const runRowAction = async (action: () => Promise<{ error?: unknown }>) => {
    setError(undefined);
    const result = await action();
    if (result.error) {
      setError('Det gick inte att spara ändringen');
      return;
    }
    onChanged();
  };

  const addDraft = (costType: string) => {
    setError(undefined);
    setDrafts((current) => [...current, { key: draftSeq, costType }]);
    setDraftSeq((next) => next + 1);
  };

  const removeDraft = (key: number) => {
    setDrafts((current) => current.filter((draft) => draft.key !== key));
  };

  return (
    <div className="flex flex-col gap-16 py-24">
      <NormberakningSummaBox label={summaLabel} value={displayAmount(sum)} />

      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <Table dense background>
        <Table.Header>
          <Table.HeaderColumn>Typ</Table.HeaderColumn>
          <Table.HeaderColumn>Ansökt</Table.HeaderColumn>
          <Table.HeaderColumn>Förslag</Table.HeaderColumn>
          <Table.HeaderColumn>Godkänt</Table.HeaderColumn>
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
                onAction={(action) => void runRowAction(action)}
              />
            ))
          }
          {drafts.map((draft) => (
            <DraftExpenseRow
              key={`draft-${draft.key}`}
              errandId={errandId}
              bucket={bucket}
              costType={draft.costType}
              typeLabel={typeLabels[draft.costType] ?? draft.costType}
              onCommitted={() => {
                removeDraft(draft.key);
                onChanged();
              }}
              onRemove={() => {
                removeDraft(draft.key);
              }}
              onError={setError}
            />
          ))}
        </Table.Body>
      </Table>

      <div className="flex items-end gap-12">
        <FormControl className="w-[20rem]">
          <FormLabel className="text-small">Lägg till rad</FormLabel>
          <Select
            size="sm"
            value=""
            onChange={(event) => {
              if (event.target.value) {
                addDraft(event.target.value);
              }
            }}
          >
            <Select.Option value="">Välj typ</Select.Option>
            {types.map((type) => (
              <Select.Option key={type.code} value={type.code ?? ''}>
                {type.displayName ?? type.code}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

/** A single editable expense row: Ansökt (appliedAmount), Godkänt (caseworkerAmount) and the note are editable; the process amount is read-only. */
const ExpenseRow: FC<{
  errandId: string;
  row: NormExpenseRow;
  typeLabels: Record<string, string>;
  onAction: (action: () => Promise<{ error?: unknown }>) => void;
}> = ({ errandId, row, typeLabels, onAction }) => {
  const [applied, setApplied] = useState<string>(row.appliedAmount?.toString() ?? '');
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
              onAction(() => restoreNormRow(errandId, 'expenses', rowId));
            }}
          />
        </Table.Column>
      </Table.Row>
    );
  }

  const dirty =
    applied !== (row.appliedAmount?.toString() ?? '') ||
    amount !== (row.caseworkerAmount?.toString() ?? '') ||
    note !== (row.note ?? '');

  // Persist the row when a field loses focus, but only if something actually changed.
  const handleBlur = () => {
    if (!dirty) {
      return;
    }
    onAction(() =>
      updateNormRow(errandId, 'expenses', rowId, {
        appliedAmount: parseAmount(applied),
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
      <Table.Column>
        <Input
          size="sm"
          inputMode="decimal"
          className="max-w-[9rem]"
          placeholder="Ansökt"
          value={applied}
          onChange={(event) => {
            setApplied(event.target.value);
          }}
          onBlur={handleBlur}
        />
      </Table.Column>
      <Table.Column className="tabular-nums text-dark-secondary">{displayAmount(row.processAmount)}</Table.Column>
      <Table.Column>
        <Input
          size="sm"
          inputMode="decimal"
          className="max-w-[9rem]"
          placeholder={displayAmount(row.effectiveAmount)}
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
          }}
          onBlur={handleBlur}
        />
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
          maxLength={80}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
          }}
          onBlur={handleBlur}
        />
      </Table.Column>
      <Table.Column>
        <Button
          size="sm"
          variant="tertiary"
          iconButton
          aria-label="Ta bort rad"
          leftIcon={<Trash2 />}
          onClick={() => {
            onAction(() => deleteNormRow(errandId, 'expenses', rowId));
          }}
        />
      </Table.Column>
    </Table.Row>
  );
};

/**
 * A not-yet-persisted expense row. The handläggare fills it in and it's created (POST) once focus leaves
 * the row. Unlike a saved row, the Ansökt (applied) amount is editable here — caremanagement only honours
 * appliedAmount on create. An untouched draft is left in place until filled in or removed.
 */
const DraftExpenseRow: FC<{
  errandId: string;
  bucket: 'EXPENSE' | 'SPECIAL_EXPENSE';
  costType: string;
  typeLabel: string;
  onCommitted: () => void;
  onRemove: () => void;
  onError: (message: string) => void;
}> = ({ errandId, bucket, costType, typeLabel, onCommitted, onRemove, onError }) => {
  const [applied, setApplied] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const hasInput = applied.trim() !== '' || amount.trim() !== '' || note.trim() !== '';

  const commit = async () => {
    setSaving(true);
    onError('');
    const result = await addNormRow(errandId, 'expenses', {
      bucket,
      costType,
      appliedAmount: parseAmount(applied),
      caseworkerAmount: parseAmount(amount),
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (result.error) {
      onError('Det gick inte att lägga till raden');
      return;
    }
    onCommitted();
  };

  // Create the row only when focus leaves the row entirely (not when moving between its own fields) and
  // the handläggare has entered something.
  const handleRowBlur = (event: FocusEvent<HTMLTableRowElement>) => {
    if (event.currentTarget.contains(event.relatedTarget) || saving || !hasInput) {
      return;
    }
    void commit();
  };

  return (
    <Table.Row onBlur={handleRowBlur}>
      <Table.Column>
        <span className="font-bold">{typeLabel}</span>
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
          inputMode="decimal"
          className="max-w-[9rem]"
          placeholder="Ansökt"
          value={applied}
          onChange={(event) => {
            setApplied(event.target.value);
          }}
        />
      </Table.Column>
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
      <Table.Column>
        <Input
          size="sm"
          maxLength={80}
          placeholder="Anmärkning"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>
        {saving ?
          <Spinner size={2} />
        : <Button
            size="sm"
            variant="tertiary"
            iconButton
            aria-label="Ta bort rad"
            leftIcon={<Trash2 />}
            onClick={onRemove}
          />
        }
      </Table.Column>
    </Table.Row>
  );
};
