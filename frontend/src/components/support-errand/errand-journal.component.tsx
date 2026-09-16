'use client';

import { useErrandJournal } from '@hooks/use-errand-journal';
import { deleteJournalEntry, JournalEntry, lockJournalEntry } from '@services/journal-service';
import { Button, Modal } from '@sk-web-gui/react';
import { Lock, Pencil, Plus, Trash } from 'lucide-react';
import { FC, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ErrandSectionHeader } from './errand-section-header.component';
import { JournalEntryCreateModal } from './journal-entry-create-modal.component';
import { JournalEntryEditModal } from './journal-entry-edit-modal.component';
import { LifecareSourceBadge } from './lifecare-source-badge.component';
import { RecordAction, RecordActionsMenu } from './record-actions-menu.component';
import { RecordBodyText } from './record-body-text.component';
import { RecordCard, RecordCardDetail, RecordHeadingEmphasis } from './record-card.component';
import { RecordList } from './record-list.component';
import { RecordStatusBadge } from './record-status-badge.component';

/** Sort newest first by the documented date and time. */
const byDateDesc = (a: JournalEntry, b: JournalEntry): number =>
  (b.entryDateTime ?? '').localeCompare(a.entryDateTime ?? '');

/** "Journal" tab — the errand's journalanteckningar (Lifecare case journal): list + create/edit/lock/delete. */
export const ErrandJournal: FC<{ errandId: string }> = ({ errandId }) => {
  const { entries, types, isLoading, error, refresh } = useErrandJournal(errandId);
  const { t } = useTranslation('documentation');

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

  /** Only WORKING (arbetsanteckning) entries can be edited, locked or deleted. */
  const actionsFor = (entry: JournalEntry): RecordAction[] =>
    entry.status === 'LOCKED' ?
      []
    : [
        {
          label: t('common:edit'),
          icon: <Pencil />,
          onClick: () => {
            setEditEntry(entry);
          },
        },
        {
          label: t('common:lock'),
          icon: <Lock />,
          onClick: () => {
            setLockTarget(entry);
          },
        },
        { label: t('common:delete'), icon: <Trash />, onClick: () => void remove(entry.id) },
      ];

  return (
    <div className="flex flex-col gap-24">
      <ErrandSectionHeader
        title={t('journal.title')}
        description={t('journal.description')}
        action={
          <Button
            color="vattjom"
            variant="primary"
            size="sm"
            leftIcon={<Plus />}
            onClick={() => {
              setShowCreate(true);
            }}
          >
            {t('journal.newEntry')}
          </Button>
        }
      />

      <RecordList
        error={error}
        errorText={t('journal.loadError')}
        title={t('journal.listTitle')}
        isLoading={isLoading}
        isEmpty={entries.length === 0}
        emptyText={t('journal.empty')}
      >
        {[...entries].sort(byDateDesc).map((entry, index) => (
          <RecordCard
            key={entry.id ?? index}
            heading={entry.heading}
            dateTime={entry.entryDateTime}
            badges={
              <>
                <LifecareSourceBadge source={entry.source} />
                <RecordStatusBadge status={entry.status} workingLabel={t('journal.workingStatus')} />
              </>
            }
            menu={
              <RecordActionsMenu
                recordLabel={entry.heading}
                actions={actionsFor(entry)}
                loading={!!entry.id && busyId === entry.id}
              />
            }
          >
            <RecordCardDetail label={t('record.addedBy')} value={entry.createdBy} />
            <RecordCardDetail label={t('record.type')} value={entry.type} />
            <RecordBodyText text={entry.text} />
          </RecordCard>
        ))}
      </RecordList>

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
        label={t('journal.lockTitle')}
      >
        <Modal.Content>
          <p className="m-0">
            <Trans
              t={t}
              i18nKey="journal.lockConfirm"
              components={{ heading: <RecordHeadingEmphasis heading={lockTarget?.heading} /> }}
            />
          </p>
        </Modal.Content>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setLockTarget(undefined);
            }}
          >
            {t('common:cancel')}
          </Button>
          <Button color="vattjom" variant="primary" loading={busyId === lockTarget?.id} onClick={() => void lock()}>
            {t('common:lock')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
