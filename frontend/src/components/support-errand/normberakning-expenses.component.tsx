'use client';

import {
  addNormRow,
  deleteNormRow,
  NormExpenseRow,
  restoreNormRow,
  TypeOption,
  updateNormRow,
} from '@services/normberakning-service';
import { Button, FormControl, FormLabel, Input, Select, Spinner, Table } from '@sk-web-gui/react';
import { displayAmount } from '@utils/format-amount';
import { RotateCcw, Trash2 } from 'lucide-react';
import { FC, FocusEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NormberakningSummaBox } from './normberakning-summa-box.component';
import { NormberakningTableBox } from './normberakning-table-box.component';

const parseAmount = (value: string): number | undefined => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const expenseLabel = (row: NormExpenseRow): string => {
  if (row.specification?.trim()) {
    return row.specification;
  }
  // costTypeDisplayName is caremanagement's Lifecare label, the same text a warning about the row uses.
  return row.costTypeDisplayName ?? row.costType ?? '—';
};

interface NormberakningExpensesProps {
  errandId: string;
  /** The title of the grey table box (e.g. "Utgifter"). */
  title: string;
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
  title,
  rows,
  sum,
  summaLabel,
  bucket,
  types,
  onChanged,
}) => {
  const { t } = useTranslation('calculation');
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
      setError(t('table.saveError'));
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
    <NormberakningTableBox
      title={title}
      summary={<NormberakningSummaBox label={summaLabel} value={displayAmount(sum)} />}
    >
      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <Table dense>
        <Table.Header>
          <Table.HeaderColumn>{t('table.type')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('expenses.applied')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('expenses.proposed')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('expenses.approved')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('table.note')}</Table.HeaderColumn>
          <Table.HeaderColumn>
            <span className="sr-only">{t('table.actions')}</span>
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ?
            <Table.Row>
              <Table.Column>{t('expenses.empty')}</Table.Column>
            </Table.Row>
          : rows.map((row, index) => (
              <ExpenseRow
                key={row.id ?? index}
                errandId={errandId}
                row={row}
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
          <FormLabel className="text-small">{t('table.addRow')}</FormLabel>
          <Select
            size="sm"
            value=""
            onChange={(event) => {
              if (event.target.value) {
                addDraft(event.target.value);
              }
            }}
          >
            <Select.Option value="">{t('expenses.selectType')}</Select.Option>
            {types.map((type) => (
              <Select.Option key={type.code} value={type.code ?? ''}>
                {type.displayName ?? type.code}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      </div>
    </NormberakningTableBox>
  );
};

/** A single editable expense row: Ansökt (appliedAmount), Godkänt (caseworkerAmount) and the note are editable; the process amount is read-only. */
const ExpenseRow: FC<{
  errandId: string;
  row: NormExpenseRow;
  onAction: (action: () => Promise<{ error?: unknown }>) => void;
}> = ({ errandId, row, onAction }) => {
  const { t } = useTranslation('calculation');
  const [applied, setApplied] = useState<string>(row.appliedAmount?.toString() ?? '');
  const [amount, setAmount] = useState<string>(row.caseworkerAmount?.toString() ?? '');
  const [note, setNote] = useState<string>(row.note ?? '');
  const rowId = row.id ?? '';

  if (row.deleted) {
    return (
      <Table.Row className="opacity-50">
        <Table.Column>
          <span className="line-through">{expenseLabel(row)}</span>
        </Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>—</Table.Column>
        <Table.Column>
          <span className="italic">{t('table.deleted')}</span>
        </Table.Column>
        <Table.Column>
          <Button
            size="sm"
            variant="tertiary"
            iconButton
            aria-label={t('table.restoreRow')}
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
        <span className="font-bold">{expenseLabel(row)}</span>
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
          inputMode="decimal"
          className="max-w-[9rem]"
          placeholder={t('expenses.applied')}
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
          aria-label={t('table.deleteRow')}
          data-lock-hides
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
  const { t } = useTranslation('calculation');
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
      onError(t('table.addError'));
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
          placeholder={t('expenses.applied')}
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
          placeholder={t('expenses.amount')}
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
          placeholder={t('table.note')}
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
            aria-label={t('table.deleteRow')}
            data-lock-hides
            leftIcon={<Trash2 />}
            onClick={onRemove}
          />
        }
      </Table.Column>
    </Table.Row>
  );
};
