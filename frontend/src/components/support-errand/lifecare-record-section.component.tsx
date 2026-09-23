'use client';

import { useLifecareDocuments } from '@hooks/use-lifecare-documents';
import { LifecareRecord } from '@services/lifecare-documents-service';
import { Button } from '@sk-web-gui/react';
import { Eye, Plus } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrandSectionHeader } from './errand-section-header.component';
import { LifecareDocumentCreateModal } from './lifecare-document-create-modal.component';
import { LifecareJournalNoteCreateModal } from './lifecare-journal-note-create-modal.component';
import { LifecareRecordModal } from './lifecare-record-modal.component';
import { RecordActionsMenu } from './record-actions-menu.component';
import { RecordCard, RecordCardDetail } from './record-card.component';
import { RecordList } from './record-list.component';

type RecordCategory = LifecareRecord['category'];

/** Newest first by the documented date and time. */
const byDateDesc = (a: LifecareRecord, b: LifecareRecord): number => (b.dateTime ?? '').localeCompare(a.dateTime ?? '');

/** The `documentation` i18n keys for a section, chosen by which record kind it lists. */
const keysFor = (category: RecordCategory) =>
  category === 'JOURNAL_NOTE' ?
    {
      title: 'journal.title',
      description: 'journal.description',
      newRecord: 'journal.newEntry',
      listTitle: 'journal.listTitle',
      empty: 'journal.empty',
    }
  : {
      title: 'documents.title',
      description: 'documents.description',
      newRecord: 'documents.newDocument',
      listTitle: 'documents.listTitle',
      empty: 'documents.empty',
    };

/**
 * One tab's worth of Lifecare records — the applicant's journalanteckningar or their documents, read
 * live from Lifecare. A record opens to show its body and can be edited when Lifecare still allows it.
 * Both tabs also write new records — journalanteckningar and documents — straight to the insats of the
 * errand in Lifecare.
 *
 * Both the "Journal" and "Dokument" tabs are this component with a different `category`; the data comes
 * from the same person-wide Lifecare list, split by kind on the backend.
 */
export const LifecareRecordSection: FC<{ errandId: string; category: RecordCategory }> = ({ errandId, category }) => {
  const { records, isLoading, error, refresh } = useLifecareDocuments(errandId);
  const { t } = useTranslation('documentation');
  const [openRecord, setOpenRecord] = useState<LifecareRecord>();
  const [showCreate, setShowCreate] = useState<boolean>(false);

  const keys = keysFor(category);
  const CreateModal = category === 'JOURNAL_NOTE' ? LifecareJournalNoteCreateModal : LifecareDocumentCreateModal;
  const items = category === 'JOURNAL_NOTE' ? records.journalNotes : records.documents;

  return (
    <div className="flex flex-col gap-24">
      <ErrandSectionHeader
        title={t(keys.title)}
        description={t(keys.description)}
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
            {t(keys.newRecord)}
          </Button>
        }
      />

      <RecordList
        title={t(keys.listTitle)}
        isLoading={isLoading}
        error={error}
        errorText={t('lifecare.loadError')}
        isEmpty={items.length === 0}
        emptyText={t(keys.empty)}
      >
        {[...items].sort(byDateDesc).map((record) => (
          <RecordCard
            key={record.id}
            heading={record.title}
            dateTime={record.dateTime}
            badges={
              <>
                <span className="shrink-0 text-small rounded-8 px-8 py-2 bg-vattjom-background-200 text-vattjom-text-primary">
                  {t('lifecare.sourceBadge')}
                </span>
                {record.locked ?
                  <span className="shrink-0 text-small rounded-8 px-8 py-2 bg-success-background-100 text-success-surface-primary">
                    {t('record.lockedStatus')}
                  </span>
                : null}
              </>
            }
            menu={
              <RecordActionsMenu
                recordLabel={record.title}
                actions={[
                  {
                    label: t('lifecare.open'),
                    icon: <Eye />,
                    onClick: () => {
                      setOpenRecord(record);
                    },
                  },
                ]}
              />
            }
          >
            <RecordCardDetail label={t('lifecare.type')} value={record.type} />
            <RecordCardDetail label={t('lifecare.owner')} value={record.ownerTypeText} />
            <RecordCardDetail label={t('lifecare.responsible')} value={record.responsibleCaseworker} />
            <RecordCardDetail label={t('lifecare.modifiedBy')} value={record.modifiedBy} />
          </RecordCard>
        ))}
      </RecordList>

      {openRecord ?
        <LifecareRecordModal
          errandId={errandId}
          record={openRecord}
          onClose={() => {
            setOpenRecord(undefined);
          }}
          onSaved={() => {
            setOpenRecord(undefined);
            refresh();
          }}
        />
      : null}

      {showCreate ?
        <CreateModal
          errandId={errandId}
          onClose={() => {
            setShowCreate(false);
          }}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      : null}
    </div>
  );
};
