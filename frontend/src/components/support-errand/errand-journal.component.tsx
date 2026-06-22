'use client';

import { useErrandJournal } from '@hooks/use-errand-journal';
import {
  createJournalEntry,
  deleteJournalEntry,
  JournalEntry,
  JournalEntryInput,
  lockJournalEntry,
  updateJournalEntry,
} from '@services/journal-service';
import { Button, DatePicker, FormControl, FormLabel, Input, Modal, Select, Spinner, Textarea } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { Lock, Pencil, Trash } from 'lucide-react';
import { FC, useState } from 'react';

const todayDate = (): string => dayjs().format('YYYY-MM-DD');

/** WORKING = editable arbetsanteckning, LOCKED = upprättad (read-only) handling. */
const statusLabel = (status?: string): string => (status === 'LOCKED' ? 'Upprättad' : 'Arbetsanteckning');

/** Sort newest first by documented date + time. */
const byDateDesc = (a: JournalEntry, b: JournalEntry): number =>
  `${b.entryDate ?? ''} ${b.entryTime ?? ''}`.localeCompare(`${a.entryDate ?? ''} ${a.entryTime ?? ''}`);

const metaLine = (entry: JournalEntry): string =>
  [entry.type, [entry.entryDate, entry.entryTime].filter(Boolean).join(' '), entry.createdBy].filter(Boolean).join(' · ');

/** "Journal" tab — the errand's journalanteckningar (Lifecare case journal): list, create, edit and lock. */
export const ErrandJournal: FC<{ errandId: string }> = ({ errandId }) => {
  const { entries, types, isLoading, error, refresh } = useErrandJournal(errandId);

  const [type, setType] = useState<string>('');
  const [heading, setHeading] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(todayDate);
  const [entryTime, setEntryTime] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>();

  const [editEntry, setEditEntry] = useState<JournalEntry>();
  const [lockTarget, setLockTarget] = useState<JournalEntry>();
  const [busyId, setBusyId] = useState<string>();

  const canCreate = type !== '' && heading.trim() !== '' && entryDate !== '' && !saving;

  const resetForm = (): void => {
    setType('');
    setHeading('');
    setText('');
    setEntryDate(todayDate());
    setEntryTime('');
  };

  const create = async (): Promise<void> => {
    if (!canCreate) {
      return;
    }
    setSaving(true);
    setFormError(undefined);
    const input: JournalEntryInput = {
      type,
      heading: heading.trim(),
      text: text.trim() || undefined,
      entryDate,
      entryTime: entryTime || undefined,
    };
    const res = await createJournalEntry(errandId, input);
    setSaving(false);
    if (res.error) {
      setFormError('Det gick inte att spara journalanteckningen');
      return;
    }
    resetForm();
    refresh();
  };

  const remove = async (entryId?: string): Promise<void> => {
    if (!entryId) {
      return;
    }
    setBusyId(entryId);
    const res = await deleteJournalEntry(errandId, entryId);
    setBusyId(undefined);
    if (!res.error) {
      refresh();
    }
  };

  const lock = async (): Promise<void> => {
    if (!lockTarget?.id) {
      return;
    }
    setBusyId(lockTarget.id);
    const res = await lockJournalEntry(errandId, lockTarget.id);
    setBusyId(undefined);
    setLockTarget(undefined);
    if (!res.error) {
      refresh();
    }
  };

  return (
    <div className="flex flex-col gap-24 max-w-[56rem]">
      <h2 className="text-h3-sm md:text-h3-md m-0">Journal</h2>

      {error && <p className="text-error-surface-primary m-0">Det gick inte att hämta journalen ({String(error)})</p>}

      {/* Create */}
      <div className="flex flex-col gap-12 rounded-12 border-1 border-divider bg-background-200 p-16">
        <span className="font-bold">Ny journalanteckning</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <FormControl id="journal-type" className="w-full">
            <FormLabel>Typ *</FormLabel>
            <Select
              size="sm"
              className="w-full"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
              }}
            >
              <Select.Option value="">Välj typ</Select.Option>
              {types.map((journalType) => (
                <Select.Option key={journalType.code} value={journalType.displayName ?? ''}>
                  {journalType.displayName ?? journalType.code}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
          <FormControl id="journal-heading" className="w-full">
            <FormLabel>Rubrik *</FormLabel>
            <Input
              size="sm"
              value={heading}
              onChange={(event) => {
                setHeading(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="journal-date" className="w-full">
            <FormLabel>Datum *</FormLabel>
            <DatePicker
              type="date"
              size="sm"
              value={entryDate}
              onChange={(event) => {
                setEntryDate(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="journal-time" className="w-full">
            <FormLabel>Tid</FormLabel>
            <DatePicker
              type="time"
              size="sm"
              value={entryTime}
              onChange={(event) => {
                setEntryTime(event.target.value);
              }}
            />
          </FormControl>
        </div>
        <FormControl id="journal-text" className="w-full">
          <FormLabel>Text</FormLabel>
          <Textarea
            rows={3}
            className="w-full"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
          />
        </FormControl>
        {formError && <p className="text-error-surface-primary m-0">{formError}</p>}
        <div>
          <Button color="primary" size="sm" loading={saving} loadingText="Sparar" disabled={!canCreate} onClick={() => void create()}>
            Skapa
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ?
        <Spinner size={4} />
      : entries.length === 0 ?
        <p className="m-0 text-dark-secondary">Inga journalanteckningar.</p>
      : <ul className="flex flex-col gap-12 m-0 p-0 list-none">
          {[...entries].sort(byDateDesc).map((entry, index) => {
            const working = entry.status !== 'LOCKED';
            return (
              <li key={entry.id ?? index} className="rounded-12 border-1 border-divider bg-background-content p-16 flex flex-col gap-8">
                <div className="flex items-start justify-between gap-12">
                  <span className="font-bold break-words">{entry.heading}</span>
                  <span
                    className={
                      working ?
                        'shrink-0 text-small rounded-8 px-8 py-2 bg-gray-100 text-gray-600'
                      : 'shrink-0 text-small rounded-8 px-8 py-2 bg-success-background-100 text-success-surface-primary'
                    }
                  >
                    {statusLabel(entry.status)}
                  </span>
                </div>
                <span className="text-small text-dark-secondary">{metaLine(entry)}</span>
                {entry.text ? <p className="m-0 break-words whitespace-pre-wrap">{entry.text}</p> : null}
                {working ?
                  <div className="flex gap-8 pt-4">
                    <Button
                      size="sm"
                      variant="tertiary"
                      leftIcon={<Pencil />}
                      onClick={() => {
                        setEditEntry(entry);
                      }}
                    >
                      Redigera
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      leftIcon={<Lock />}
                      onClick={() => {
                        setLockTarget(entry);
                      }}
                    >
                      Lås
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      leftIcon={<Trash />}
                      loading={busyId === entry.id}
                      onClick={() => void remove(entry.id)}
                    >
                      Ta bort
                    </Button>
                  </div>
                : null}
              </li>
            );
          })}
        </ul>
      }

      {editEntry ?
        <EditJournalEntryModal
          errandId={errandId}
          entry={editEntry}
          onClose={() => {
            setEditEntry(undefined);
          }}
          onSaved={() => {
            setEditEntry(undefined);
            refresh();
          }}
        />
      : null}

      <Modal
        show={!!lockTarget}
        onClose={() => {
          setLockTarget(undefined);
        }}
        label="Lås journalanteckning"
      >
        <Modal.Content>
          <p className="m-0">
            Vill du låsa <strong>{lockTarget?.heading}</strong>? Den blir en upprättad handling och kan inte ändras eller
            tas bort.
          </p>
        </Modal.Content>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setLockTarget(undefined);
            }}
          >
            Avbryt
          </Button>
          <Button color="vattjom" variant="primary" loading={busyId === lockTarget?.id} onClick={() => void lock()}>
            Lås
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

/** Edit modal for a WORKING journalanteckning. */
const EditJournalEntryModal: FC<{
  errandId: string;
  entry: JournalEntry;
  onClose: () => void;
  onSaved: () => void;
}> = ({ errandId, entry, onClose, onSaved }) => {
  const [type] = useState<string>(entry.type ?? '');
  const [heading, setHeading] = useState<string>(entry.heading ?? '');
  const [text, setText] = useState<string>(entry.text ?? '');
  const [entryDate, setEntryDate] = useState<string>(entry.entryDate ?? todayDate());
  const [entryTime, setEntryTime] = useState<string>(entry.entryTime ?? '');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const save = async (): Promise<void> => {
    if (!entry.id) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const input: JournalEntryInput = {
      type,
      heading: heading.trim(),
      text: text.trim() || undefined,
      entryDate,
      entryTime: entryTime || undefined,
    };
    const res = await updateJournalEntry(errandId, entry.id, input);
    setSaving(false);
    if (res.error) {
      setError('Det gick inte att spara ändringen');
      return;
    }
    onSaved();
  };

  return (
    <Modal show onClose={onClose} label="Redigera journalanteckning" className="w-[43rem]">
      <Modal.Content className="flex flex-col gap-12">
        <FormControl id="journal-edit-heading" className="w-full">
          <FormLabel>Rubrik *</FormLabel>
          <Input
            value={heading}
            onChange={(event) => {
              setHeading(event.target.value);
            }}
          />
        </FormControl>
        <div className="grid grid-cols-2 gap-12">
          <FormControl id="journal-edit-date" className="w-full">
            <FormLabel>Datum *</FormLabel>
            <DatePicker
              type="date"
              value={entryDate}
              onChange={(event) => {
                setEntryDate(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="journal-edit-time" className="w-full">
            <FormLabel>Tid</FormLabel>
            <DatePicker
              type="time"
              value={entryTime}
              onChange={(event) => {
                setEntryTime(event.target.value);
              }}
            />
          </FormControl>
        </div>
        <FormControl id="journal-edit-text" className="w-full">
          <FormLabel>Text</FormLabel>
          <Textarea
            rows={4}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
          />
        </FormControl>
        {error && <p className="text-error-surface-primary m-0">{error}</p>}
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Avbryt
        </Button>
        <Button
          color="vattjom"
          variant="primary"
          loading={saving}
          disabled={heading.trim() === '' || entryDate === ''}
          onClick={() => void save()}
        >
          Spara
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
