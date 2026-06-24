'use client';

import { addNormRow, deleteNormRow, NormIncomeRow, restoreNormRow, TypeOption, updateNormRow } from '@services/normberakning-service';
import { Button, DatePicker, FormControl, FormLabel, Input, Select, Spinner, Table } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import dayjs from 'dayjs';
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

// caremanagement stores the income amount dates as date-time; the field only needs the day (yyyy-MM-dd).
const toDateInput = (value?: string): string => (value ? dayjs(value).format('YYYY-MM-DD') : '');

interface NormberakningIncomesProps {
  errandId: string;
  rows: NormIncomeRow[];
  incomeSum?: number;
  incomeTypes: TypeOption[];
  onChanged: () => void;
}

/**
 * INKOMSTER section — one row per income type with an applicant (S) and co-applicant (M) side. The
 * process amount is read-only (system/SSBTEK, shown as the input placeholder); the handläggare amount +
 * date + note are editable. Handläggare can also add their own rows and soft-delete/restore rows.
 */
export const NormberakningIncomes: FC<NormberakningIncomesProps> = ({
  errandId,
  rows,
  incomeSum,
  incomeTypes,
  onChanged,
}) => {
  const [error, setError] = useState<string>();
  // Draft rows: picking a type below the table adds a not-yet-persisted row to the list. It's created
  // once the handläggare fills it in and focus leaves the row (see DraftIncomeRow).
  const [drafts, setDrafts] = useState<{ key: number; typeName: string }[]>([]);
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

  const addDraft = (typeName: string) => {
    setError(undefined);
    setDrafts((current) => [...current, { key: draftSeq, typeName }]);
    setDraftSeq((next) => next + 1);
  };

  const removeDraft = (key: number) => {
    setDrafts((current) => current.filter((draft) => draft.key !== key));
  };

  return (
    <div className="flex flex-col gap-16 py-24">
      <NormberakningSummaBox label="Summa inkomster" value={displayAmount(incomeSum)} />

      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <Table dense background>
        <Table.Header>
          <Table.HeaderColumn>Typ</Table.HeaderColumn>
          <Table.HeaderColumn>Belopp S</Table.HeaderColumn>
          <Table.HeaderColumn>Datum S</Table.HeaderColumn>
          <Table.HeaderColumn>Belopp M</Table.HeaderColumn>
          <Table.HeaderColumn>Datum M</Table.HeaderColumn>
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
                errandId={errandId}
                row={row}
                onAction={(action) => void runRowAction(action)}
              />
            ))
          }
          {drafts.map((draft) => (
            <DraftIncomeRow
              key={`draft-${draft.key}`}
              errandId={errandId}
              typeName={draft.typeName}
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
            <Select.Option value="">Välj inkomsttyp</Select.Option>
            {incomeTypes.map((type) => (
              <Select.Option key={type.code} value={type.displayName ?? ''}>
                {type.displayName ?? type.code}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

/** A single editable income row (handläggare S/M amount, date, note); process and effective are read-only. */
const IncomeRow: FC<{
  errandId: string;
  row: NormIncomeRow;
  onAction: (action: () => Promise<{ error?: unknown }>) => void;
}> = ({ errandId, row, onAction }) => {
  const [applicantAmount, setApplicantAmount] = useState<string>(row.applicantCaseworkerAmount?.toString() ?? '');
  const [applicantDate, setApplicantDate] = useState<string>(toDateInput(row.applicantAmountDate));
  const [coapplicantAmount, setCoapplicantAmount] = useState<string>(row.coapplicantCaseworkerAmount?.toString() ?? '');
  const [coapplicantDate, setCoapplicantDate] = useState<string>(toDateInput(row.coapplicantAmountDate));
  const [note, setNote] = useState<string>(row.note ?? '');

  const rowId = row.id ?? '';

  if (row.deleted) {
    return (
      <Table.Row className="opacity-50">
        <Table.Column>
          <span className="line-through">{row.typeName ?? 'Inkomst'}</span>
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
              onAction(() => restoreNormRow(errandId, 'incomes', rowId));
            }}
          />
        </Table.Column>
      </Table.Row>
    );
  }

  const dirty =
    applicantAmount !== (row.applicantCaseworkerAmount?.toString() ?? '') ||
    applicantDate !== toDateInput(row.applicantAmountDate) ||
    coapplicantAmount !== (row.coapplicantCaseworkerAmount?.toString() ?? '') ||
    coapplicantDate !== toDateInput(row.coapplicantAmountDate) ||
    note !== (row.note ?? '');

  // Persist the row when a field loses focus, but only if something actually changed.
  const handleBlur = () => {
    if (!dirty) {
      return;
    }
    onAction(() =>
      updateNormRow(errandId, 'incomes', rowId, {
        applicantCaseworkerAmount: parseAmount(applicantAmount),
        applicantAmountDate: applicantDate.trim() || undefined,
        coapplicantCaseworkerAmount: parseAmount(coapplicantAmount),
        coapplicantAmountDate: coapplicantDate.trim() || undefined,
        note: note.trim() || undefined,
      })
    );
  };

  return (
    <Table.Row>
      <Table.Column>
        <span className="font-bold">{row.typeName ?? 'Inkomst'}</span>
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
          className="max-w-[9rem]"
          inputMode="decimal"
          placeholder={displayAmount(row.applicantProcessAmount)}
          value={applicantAmount}
          onChange={(event) => {
            setApplicantAmount(event.target.value);
          }}
          onBlur={handleBlur}
        />
      </Table.Column>
      <Table.Column>
        <DatePicker
          type="date"
          size="sm"
          value={applicantDate}
          onChange={(event) => {
            setApplicantDate(event.target.value);
          }}
          onBlur={handleBlur}
        />
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
          className="max-w-[9rem]"
          inputMode="decimal"
          placeholder={displayAmount(row.coapplicantProcessAmount)}
          value={coapplicantAmount}
          onChange={(event) => {
            setCoapplicantAmount(event.target.value);
          }}
          onBlur={handleBlur}
        />
      </Table.Column>
      <Table.Column>
        <DatePicker
          type="date"
          size="sm"
          value={coapplicantDate}
          onChange={(event) => {
            setCoapplicantDate(event.target.value);
          }}
          onBlur={handleBlur}
        />
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
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
            onAction(() => deleteNormRow(errandId, 'incomes', rowId));
          }}
        />
      </Table.Column>
    </Table.Row>
  );
};

/**
 * A not-yet-persisted income row. The handläggare fills in the S/M amounts, dates and note, and it's
 * created (POST) once focus leaves the row. An untouched draft is left in place until filled in or removed.
 */
const DraftIncomeRow: FC<{
  errandId: string;
  typeName: string;
  onCommitted: () => void;
  onRemove: () => void;
  onError: (message: string) => void;
}> = ({ errandId, typeName, onCommitted, onRemove, onError }) => {
  const [applicantAmount, setApplicantAmount] = useState<string>('');
  const [applicantDate, setApplicantDate] = useState<string>('');
  const [coapplicantAmount, setCoapplicantAmount] = useState<string>('');
  const [coapplicantDate, setCoapplicantDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const hasInput =
    applicantAmount.trim() !== '' ||
    applicantDate.trim() !== '' ||
    coapplicantAmount.trim() !== '' ||
    coapplicantDate.trim() !== '' ||
    note.trim() !== '';

  const commit = async () => {
    setSaving(true);
    onError('');
    const result = await addNormRow(errandId, 'incomes', {
      typeName,
      applicantCaseworkerAmount: parseAmount(applicantAmount),
      applicantAmountDate: applicantDate.trim() || undefined,
      coapplicantCaseworkerAmount: parseAmount(coapplicantAmount),
      coapplicantAmountDate: coapplicantDate.trim() || undefined,
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
        <span className="font-bold">{typeName}</span>
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
          className="max-w-[9rem]"
          inputMode="decimal"
          placeholder="Belopp S"
          value={applicantAmount}
          onChange={(event) => {
            setApplicantAmount(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>
        <DatePicker
          type="date"
          size="sm"
          value={applicantDate}
          onChange={(event) => {
            setApplicantDate(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>
        <Input
          size="sm"
          className="max-w-[9rem]"
          inputMode="decimal"
          placeholder="Belopp M"
          value={coapplicantAmount}
          onChange={(event) => {
            setCoapplicantAmount(event.target.value);
          }}
        />
      </Table.Column>
      <Table.Column>
        <DatePicker
          type="date"
          size="sm"
          value={coapplicantDate}
          onChange={(event) => {
            setCoapplicantDate(event.target.value);
          }}
        />
      </Table.Column>
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
