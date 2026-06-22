'use client';

import { useErrandJournal } from '@hooks/use-errand-journal';
import { deleteJournalEntry, JournalEntry, lockJournalEntry } from '@services/journal-service';
import { Button, Modal, Spinner } from '@sk-web-gui/react';
import { Lock, Pencil, Plus, Trash } from 'lucide-react';
import { FC, useState } from 'react';

import { JournalEntryCreateModal } from './journal-entry-create-modal.component';
import { JournalEntryEditModal } from './journal-entry-edit-modal.component';

/** WORKING = editable arbetsanteckning, LOCKED = upprättad (read-only) handling. */
const statusLabel = (status?: string): string => (status === 'LOCKED' ? 'Upprättad' : 'Arbetsanteckning');

/** Sort newest first by documented date + time. */
const byDateDesc = (a: JournalEntry, b: JournalEntry): number =>
  `${b.entryDate ?? ''} ${b.entryTime ?? ''}`.localeCompare(`${a.entryDate ?? ''} ${a.entryTime ?? ''}`);

const metaLine = (entry: JournalEntry): string =>
  [entry.type, [entry.entryDate, entry.entryTime].filter(Boolean).join(' '), entry.createdBy].filter(Boolean).join(' · ');

/** "Journal" tab — the errand's journalanteckningar (Lifecare case journal): list + create/edit/lock/delete. */
export const ErrandJournal: FC<{ errandId: string }> = ({ errandId }) => {
  const { entries, types, isLoading, error, refresh } = useErrandJournal(errandId);

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [editEntry, setEditEntry] = useState<JournalEntry>();
  const [lockTarget, setLockTarget] = useState<JournalEntry>();
  const [busyId, setBusyId] = useState<string>();

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
      <div className="flex items-center justify-between gap-12 flex-wrap">
        <h2 className="text-h3-sm md:text-h3-md m-0">Journal</h2>
        <Button
          color="vattjom"
          variant="primary"
          size="sm"
          leftIcon={<Plus />}
          onClick={() => {
            setShowCreate(true);
          }}
        >
          Ny journalanteckning
        </Button>
      </div>

      {error && <p className="text-error-surface-primary m-0">Det gick inte att hämta journalen ({String(error)})</p>}

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

      {showCreate ?
        <JournalEntryCreateModal
          errandId={errandId}
          types={types}
          onClose={() => {
            setShowCreate(false);
          }}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      : null}

      {editEntry ?
        <JournalEntryEditModal
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
