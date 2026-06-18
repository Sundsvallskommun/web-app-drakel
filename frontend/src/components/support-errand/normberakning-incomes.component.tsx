'use client';

import { DraftIncomeRow, updateNormberakningDraft } from '@services/normberakning-service';
import { Button, Input } from '@sk-web-gui/react';
import { Plus, Trash2 } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

// Amounts are held as strings while editing (so the inputs stay controlled) and parsed on save.
interface EditableRow {
  key: string;
  typeId?: number;
  typeName: string;
  applicantAmount: string;
  coApplicantAmount: string;
  note: string;
}

const toEditableRows = (rows: DraftIncomeRow[]): EditableRow[] =>
  rows.map((row, index) => ({
    key: `row-${row.typeId ?? 'custom'}-${index}`,
    typeId: row.typeId,
    typeName: row.typeName ?? '',
    applicantAmount: row.applicantAmount?.toString() ?? '',
    coApplicantAmount: row.coApplicantAmount?.toString() ?? '',
    note: row.note ?? '',
  }));

const parseAmount = (value: string): number | undefined => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

interface NormberakningIncomesProps {
  errandId: string;
  rows: DraftIncomeRow[];
  onSaved: () => void;
}

/**
 * Editable income rows of the draft normberäkning. caremanagement income rows (with an FC typeId) show
 * the type name read-only; handläggare can edit the amounts/note on any row and add their own rows.
 */
export const NormberakningIncomes: FC<NormberakningIncomesProps> = ({ errandId, rows, onSaved }) => {
  const [editableRows, setEditableRows] = useState<EditableRow[]>(() => toEditableRows(rows));
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  // Re-sync when the loaded draft changes (e.g. after a save refresh).
  useEffect(() => {
    setEditableRows(toEditableRows(rows));
  }, [rows]);

  const updateRow = (key: string, field: keyof EditableRow, value: string) => {
    setEditableRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setEditableRows((current) => [
      ...current,
      {
        key: `new-${current.length}-${Date.now()}`,
        typeName: '',
        applicantAmount: '',
        coApplicantAmount: '',
        note: '',
      },
    ]);
  };

  const removeRow = (key: string) => {
    setEditableRows((current) => current.filter((row) => row.key !== key));
  };

  const save = async () => {
    setSaving(true);
    setError(undefined);
    const payload: DraftIncomeRow[] = editableRows.map((row) => ({
      typeId: row.typeId,
      typeName: row.typeName.trim() || undefined,
      applicantAmount: parseAmount(row.applicantAmount),
      coApplicantAmount: parseAmount(row.coApplicantAmount),
      note: row.note.trim() || undefined,
    }));
    const result = await updateNormberakningDraft(errandId, payload);
    setSaving(false);
    if (result.error) {
      setError('Det gick inte att spara inkomsterna');
      return;
    }
    onSaved();
  };

  return (
    <div className="flex flex-col gap-16 py-24">
      <div className="flex flex-col gap-8">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_2fr_auto] gap-12 text-small font-bold text-dark-secondary px-2">
          <span>Inkomsttyp</span>
          <span>Sökande (kr)</span>
          <span>Medsökande (kr)</span>
          <span>Notering</span>
          <span className="sr-only">Åtgärder</span>
        </div>

        {editableRows.length === 0 ?
          <p className="m-0 text-dark-secondary">Inga inkomstrader. Lägg till en rad nedan.</p>
        : editableRows.map((row) => (
            <div key={row.key} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_2fr_auto] gap-12 items-center">
              {row.typeId ?
                <span className="font-bold text-small">{row.typeName || 'Inkomst'}</span>
              : <Input
                  size="sm"
                  value={row.typeName}
                  placeholder="Inkomsttyp"
                  onChange={(event) => {
                    updateRow(row.key, 'typeName', event.target.value);
                  }}
                />
              }
              <Input
                size="sm"
                inputMode="decimal"
                value={row.applicantAmount}
                onChange={(event) => {
                  updateRow(row.key, 'applicantAmount', event.target.value);
                }}
              />
              <Input
                size="sm"
                inputMode="decimal"
                value={row.coApplicantAmount}
                onChange={(event) => {
                  updateRow(row.key, 'coApplicantAmount', event.target.value);
                }}
              />
              <Input
                size="sm"
                value={row.note}
                placeholder="Notering"
                onChange={(event) => {
                  updateRow(row.key, 'note', event.target.value);
                }}
              />
              <Button
                size="sm"
                variant="tertiary"
                iconButton
                aria-label="Ta bort rad"
                leftIcon={<Trash2 />}
                onClick={() => {
                  removeRow(row.key);
                }}
              />
            </div>
          ))
        }
      </div>

      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <div className="flex flex-wrap gap-12">
        <Button variant="secondary" leftIcon={<Plus />} onClick={addRow}>
          Lägg till rad
        </Button>
        <Button color="vattjom" variant="primary" loading={saving} loadingText="Sparar…" onClick={() => void save()}>
          Spara inkomster
        </Button>
      </div>
    </div>
  );
};
