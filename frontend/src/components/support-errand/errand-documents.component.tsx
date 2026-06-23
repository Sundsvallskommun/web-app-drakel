'use client';

import { useErrandDocuments } from '@hooks/use-errand-documents';
import { deleteDocument, Document, lockDocument } from '@services/document-service';
import { Button, Modal, Spinner } from '@sk-web-gui/react';
import { Lock, Pencil, Plus, Trash } from 'lucide-react';
import { FC, useState } from 'react';

import { DocumentCreateModal } from './document-create-modal.component';
import { DocumentEditModal } from './document-edit-modal.component';

/** WORKING = editable draft, LOCKED = upprättad (read-only) handling. */
const statusLabel = (status?: string): string => (status === 'LOCKED' ? 'Upprättad' : 'Utkast');

/** Sort newest first by documented date + time. */
const byDateDesc = (a: Document, b: Document): number =>
  `${b.documentDate ?? ''} ${b.documentTime ?? ''}`.localeCompare(`${a.documentDate ?? ''} ${a.documentTime ?? ''}`);

const metaLine = (document: Document): string =>
  [document.type, [document.documentDate, document.documentTime].filter(Boolean).join(' '), document.createdBy]
    .filter(Boolean)
    .join(' · ');

/** "Dokument" tab — the errand's formal case documents (Lifecare handlingar): list + create/edit/lock/delete. */
export const ErrandDocuments: FC<{ errandId: string }> = ({ errandId }) => {
  const { documents, types, isLoading, error, refresh } = useErrandDocuments(errandId);

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

  return (
    <div className="flex flex-col gap-24 max-w-[56rem]">
      <div className="flex items-center justify-between gap-12 flex-wrap">
        <h2 className="text-h3-sm md:text-h3-md m-0">Dokument</h2>
        <Button
          color="vattjom"
          variant="primary"
          size="sm"
          leftIcon={<Plus />}
          onClick={() => {
            setShowCreate(true);
          }}
        >
          Nytt dokument
        </Button>
      </div>

      {error && <p className="text-error-surface-primary m-0">Det gick inte att hämta dokumenten ({String(error)})</p>}

      {isLoading ?
        <Spinner size={4} />
      : documents.length === 0 ?
        <p className="m-0 text-dark-secondary">Inga dokument.</p>
      : <ul className="flex flex-col gap-12 m-0 p-0 list-none">
          {[...documents].sort(byDateDesc).map((document, index) => {
            const working = document.status !== 'LOCKED';
            return (
              <li key={document.id ?? index} className="rounded-12 border-1 border-divider bg-background-content p-16 flex flex-col gap-8">
                <div className="flex items-start justify-between gap-12">
                  <span className="font-bold break-words">{document.heading}</span>
                  <span
                    className={
                      working ?
                        'shrink-0 text-small rounded-8 px-8 py-2 bg-gray-100 text-gray-600'
                      : 'shrink-0 text-small rounded-8 px-8 py-2 bg-success-background-100 text-success-surface-primary'
                    }
                  >
                    {statusLabel(document.status)}
                  </span>
                </div>
                <span className="text-small text-dark-secondary">{metaLine(document)}</span>
                {document.text ? <p className="m-0 break-words whitespace-pre-wrap">{document.text}</p> : null}
                {working ?
                  <div className="flex gap-8 pt-4">
                    <Button
                      size="sm"
                      variant="tertiary"
                      leftIcon={<Pencil />}
                      onClick={() => {
                        setEditDocument(document);
                      }}
                    >
                      Redigera
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      leftIcon={<Lock />}
                      onClick={() => {
                        setLockTarget(document);
                      }}
                    >
                      Lås
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      leftIcon={<Trash />}
                      loading={busyId === document.id}
                      onClick={() => void remove(document.id)}
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
        label="Lås dokument"
      >
        <Modal.Content>
          <p className="m-0">
            Vill du låsa <strong>{lockTarget?.heading}</strong>? Det blir en upprättad handling och kan inte ändras eller
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
