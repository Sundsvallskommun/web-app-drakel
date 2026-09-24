'use client';

import { useLifecareDocuments } from '@hooks/use-lifecare-documents';
import { useLifecareRecordBodies } from '@hooks/use-lifecare-record-bodies';
import { LifecareRecord } from '@services/lifecare-documents-service';
import { Button, SearchField } from '@sk-web-gui/react';
import { filterLifecareRecords } from '@utils/lifecare-record-search';
import { Eye, Plus } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrandSectionHeader } from './errand-section-header.component';
import { LifecareDocumentCreateModal } from './lifecare-document-create-modal.component';
import { LifecareJournalNoteCreateModal } from './lifecare-journal-note-create-modal.component';
import { LifecareRecordBody } from './lifecare-record-body.component';
import { LifecareRecordModal } from './lifecare-record-modal.component';
import { RecordActionsMenu } from './record-actions-menu.component';
import { RecordCard, RecordCardDetail } from './record-card.component';
import { RecordList } from './record-list.component';
import { TreservaJournalButton } from './treserva-journal-button.component';

type RecordCategory = LifecareRecord['category'];

/** Newest first by the documented date and time. */
const byDateDesc = (a: LifecareRecord, b: LifecareRecord): number => (b.dateTime ?? '').localeCompare(a.dateTime ?? '');

/** Lifecare was asked for this record's text but would not hand it over. */
const isUnreadBody = (body?: { content?: string }): boolean => body !== undefined && body.content === undefined;

/** The `documentation` i18n keys for a section, chosen by which record kind it lists. */
const keysFor = (category: RecordCategory) =>
  category === 'JOURNAL_NOTE' ?
    {
      title: 'journal.title',
      description: 'journal.description',
      newRecord: 'journal.newEntry',
      listTitle: 'journal.listTitle',
      empty: 'journal.empty',
      searchLabel: 'lifecare.searchJournal',
    }
  : {
      title: 'documents.title',
      description: 'documents.description',
      newRecord: 'documents.newDocument',
      listTitle: 'documents.listTitle',
      empty: 'documents.empty',
      searchLabel: 'lifecare.searchDocuments',
    };

/**
 * One tab's worth of Lifecare records — the applicant's journalanteckningar or their documents, read
 * live from Lifecare. Every card shows the record's text, and the search box narrows the list in the
 * browser — by heading, type, akt, handläggare or text — without asking the BFF again. A record opens to
 * be edited when Lifecare still allows it.
 * Both tabs also write new records — journalanteckningar and documents — straight to the insats of the
 * errand in Lifecare.
 *
 * Both the "Journal" and "Dokument" tabs are this component with a different `category`; the data comes
 * from the same person-wide Lifecare list, split by kind on the backend.
 */
export const LifecareRecordSection: FC<{ errandId: string; category: RecordCategory }> = ({ errandId, category }) => {
  const { records, isLoading, error, refresh } = useLifecareDocuments(errandId);
  const bodies = useLifecareRecordBodies(errandId, category);
  const { t } = useTranslation('documentation');
  const [openRecord, setOpenRecord] = useState<LifecareRecord>();
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const keys = keysFor(category);
  const CreateModal = category === 'JOURNAL_NOTE' ? LifecareJournalNoteCreateModal : LifecareDocumentCreateModal;
  const items = category === 'JOURNAL_NOTE' ? records.journalNotes : records.documents;
  const matches = filterLifecareRecords(items, bodies.bodyById, searchQuery);

  const refreshAll = (): void => {
    refresh();
    bodies.refresh();
  };

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

      {/* The journal migrated from Treserva comes first on the Journal tab. TODO(treserva-journal): a MOCK
          until the migrated data is in Lifecare — see TreservaJournalButton. */}
      {category === 'JOURNAL_NOTE' ?
        <TreservaJournalButton errandId={errandId} />
      : null}

      <SearchField
        className="w-full sm:w-[32rem]"
        size="md"
        value={searchQuery}
        showSearchButton={false}
        placeholder={t('lifecare.searchPlaceholder')}
        aria-label={t(keys.searchLabel)}
        onChange={(event) => {
          setSearchQuery(event.target.value);
        }}
        onReset={() => {
          setSearchQuery('');
        }}
      />

      <RecordList
        title={t(keys.listTitle)}
        isLoading={isLoading}
        error={error}
        errorText={t('lifecare.loadError')}
        isEmpty={matches.length === 0}
        emptyText={items.length === 0 ? t(keys.empty) : t('lifecare.noSearchMatches')}
      >
        {[...matches].sort(byDateDesc).map((record) => (
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
            <LifecareRecordBody
              content={bodies.bodyById.get(record.id)?.content}
              isLoading={bodies.isLoading}
              unreadable={bodies.failed || isUnreadBody(bodies.bodyById.get(record.id))}
            />
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
            refreshAll();
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
            refreshAll();
          }}
        />
      : null}
    </div>
  );
};
