'use client';

import { useErrandDocuments } from '@hooks/use-errand-documents';
import { deleteDocument, Document, lockDocument } from '@services/document-service';
import { Button, Modal } from '@sk-web-gui/react';
import { Lock, Pencil, Plus, Trash } from 'lucide-react';
import { FC, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { DocumentCreateModal } from './document-create-modal.component';
import { DocumentEditModal } from './document-edit-modal.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { LifecareSourceBadge } from './lifecare-source-badge.component';
import { RecordAction, RecordActionsMenu } from './record-actions-menu.component';
import { RecordBodyText } from './record-body-text.component';
import { RecordCard, RecordCardDetail, RecordHeadingEmphasis } from './record-card.component';
import { RecordList } from './record-list.component';
import { RecordStatusBadge } from './record-status-badge.component';

/** Sort newest first by the documented date and time. */
const byDateDesc = (a: Document, b: Document): number =>
  (b.documentDateTime ?? '').localeCompare(a.documentDateTime ?? '');

/** "Dokument" tab — the errand's formal case documents (Lifecare handlingar): list + create/edit/lock/delete. */
export const ErrandDocuments: FC<{ errandId: string }> = ({ errandId }) => {
  const { documents, types, isLoading, error, refresh } = useErrandDocuments(errandId);
  const { t } = useTranslation('documentation');

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [editDocument, setEditDocument] = useState<Document>();
  const [lockTarget, setLockTarget] = useState<Document>();
  const [busyId, setBusyId] = useState<string>();

  const remove = async (documentId?: string): Promise<void> => {
    if (!documentId) {
      return;
    }
    setBusyId(documentId);
    const res = await deleteDocument(errandId, documentId);
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
    const res = await lockDocument(errandId, lockTarget.id);
    setBusyId(undefined);
    setLockTarget(undefined);
    if (!res.error) {
      refresh();
    }
  };

  /** Only WORKING (utkast) documents can be edited, locked or deleted. */
  const actionsFor = (document: Document): RecordAction[] =>
    document.status === 'LOCKED' ?
      []
    : [
        {
          label: t('common:edit'),
          icon: <Pencil />,
          onClick: () => {
            setEditDocument(document);
          },
        },
        {
          label: t('common:lock'),
          icon: <Lock />,
          onClick: () => {
            setLockTarget(document);
          },
        },
        { label: t('common:delete'), icon: <Trash />, onClick: () => void remove(document.id) },
      ];

  return (
    <div className="flex flex-col gap-24">
      <ErrandSectionHeader
        title={t('documents.title')}
        description={t('documents.description')}
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
            {t('documents.newDocument')}
          </Button>
        }
      />

      <RecordList
        error={error}
        errorText={t('documents.loadError')}
        title={t('documents.listTitle')}
        isLoading={isLoading}
        isEmpty={documents.length === 0}
        emptyText={t('documents.empty')}
      >
        {[...documents].sort(byDateDesc).map((document, index) => (
          <RecordCard
            key={document.id ?? index}
            heading={document.heading}
            dateTime={document.documentDateTime}
            badges={
              <>
                <LifecareSourceBadge source={document.source} />
                <RecordStatusBadge status={document.status} workingLabel={t('documents.workingStatus')} />
              </>
            }
            menu={
              <RecordActionsMenu
                recordLabel={document.heading}
                actions={actionsFor(document)}
                loading={!!document.id && busyId === document.id}
              />
            }
          >
            <RecordCardDetail label={t('record.addedBy')} value={document.createdBy} />
            <RecordCardDetail label={t('record.type')} value={document.type} />
            <RecordBodyText text={document.text} />
          </RecordCard>
        ))}
      </RecordList>

      {showCreate ?
        <DocumentCreateModal
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

      {editDocument ?
        <DocumentEditModal
          errandId={errandId}
          document={editDocument}
          onClose={() => {
            setEditDocument(undefined);
          }}
          onSaved={() => {
            setEditDocument(undefined);
            refresh();
          }}
        />
      : null}

      <Modal
        show={!!lockTarget}
        onClose={() => {
          setLockTarget(undefined);
        }}
        label={t('documents.lockTitle')}
      >
        <Modal.Content>
          <p className="m-0">
            <Trans
              t={t}
              i18nKey="documents.lockConfirm"
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
