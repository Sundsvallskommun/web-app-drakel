'use client';

import { addNormRow, deleteNormRow, NormIncomeRow, restoreNormRow, updateNormRow } from '@services/normberakning-service';
import { Button, DatePicker, Input, Table } from '@sk-web-gui/react';
import { formatAmount } from '@utils/format-amount';
import dayjs from 'dayjs';
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

// caremanagement stores the income amount dates as date-time; the field only needs the day (yyyy-MM-dd).
const toDateInput = (value?: string): string => (value ? dayjs(value).format('YYYY-MM-DD') : '');

interface NormberakningIncomesProps {
  errandId: string;
  rows: NormIncomeRow[];
  incomeSum?: number;
  onChanged: () => void;
}

/**
 * INKOMSTER section — one row per income type with an applicant (S) and co-applicant (M) side. The
 * process amount is read-only (system/SSBTEK, shown as the input placeholder); the handläggare amount +
 * date + note are editable. Handläggare can also add their own rows and soft-delete/restore rows.
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
                saving={savingId === row.id}
                onAction={(rowId, action) => void runRowAction(rowId, action)}
              />
            ))
          }
          <AddIncomeRow errandId={errandId} onAdded={onChanged} onError={setError} />
        </Table.Body>
      </Table>
    </div>
  );
};

/** A single editable income row (handläggare S/M amount, date, note); process and effective are read-only. */
const IncomeRow: FC<{
  errandId: string;
  row: NormIncomeRow;
  saving: boolean;
  onAction: (rowId: string, action: () => Promise<{ error?: unknown }>) => void;
}> = ({ errandId, row, saving, onAction }) => {
  const [applicantAmount, setApplicantAmount] = useState<string>(row.applicantHandlaggareAmount?.toString() ?? '');
  const [applicantDate, setApplicantDate] = useState<string>(toDateInput(row.applicantAmountDate));
  const [coapplicantAmount, setCoapplicantAmount] = useState<string>(row.coapplicantHandlaggareAmount?.toString() ?? '');
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
              onAction(rowId, () => restoreNormRow(errandId, 'incomes', rowId));
            }}
          />
        </Table.Column>
      </Table.Row>
    );
  }

  const dirty =
    applicantAmount !== (row.applicantHandlaggareAmount?.toString() ?? '') ||
    applicantDate !== toDateInput(row.applicantAmountDate) ||
    coapplicantAmount !== (row.coapplicantHandlaggareAmount?.toString() ?? '') ||
    coapplicantDate !== toDateInput(row.coapplicantAmountDate) ||
    note !== (row.note ?? '');

  const save = () => {
    onAction(rowId, () =>
      updateNormRow(errandId, 'incomes', rowId, {
        applicantHandlaggareAmount: parseAmount(applicantAmount),
        applicantAmountDate: applicantDate.trim() || undefined,
        coapplicantHandlaggareAmount: parseAmount(coapplicantAmount),
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
          placeholder={displayAmount(row.coapplicantProcessAmount)}
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
              onAction(rowId, () => deleteNormRow(errandId, 'incomes', rowId));
            }}
          />
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
  const [applicantAmount, setApplicantAmount] = useState<string>('');
  const [applicantDate, setApplicantDate] = useState<string>('');
  const [coapplicantAmount, setCoapplicantAmount] = useState<string>('');
  const [coapplicantDate, setCoapplicantDate] = useState<string>('');
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
      applicantHandlaggareAmount: parseAmount(applicantAmount),
      applicantAmountDate: applicantDate || undefined,
      coapplicantHandlaggareAmount: parseAmount(coapplicantAmount),
      coapplicantAmountDate: coapplicantDate || undefined,
      note: note.trim() || undefined,
    });
    setAdding(false);
    if (result.error) {
      onError('Det gick inte att lägga till raden');
      return;
    }
    setTypeName('');
    setApplicantAmount('');
    setApplicantDate('');
    setCoapplicantAmount('');
    setCoapplicantDate('');
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
        <Button size="sm" variant="secondary" leftIcon={<Plus />} loading={adding} onClick={() => void add()}>
          Lägg till
        </Button>
      </Table.Column>
    </Table.Row>
  );
};
