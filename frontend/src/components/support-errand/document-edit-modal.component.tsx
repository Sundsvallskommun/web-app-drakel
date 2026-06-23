'use client';

import { Document, DocumentInput, updateDocument } from '@services/document-service';
import { Button, Modal } from '@sk-web-gui/react';
import { FC, useState } from 'react';

import { DocumentFields, DocumentFieldValues } from './document-fields.component';
import { todayDate } from './journal-entry-fields.component';

/** Edit modal for a WORKING dokument (the type stays fixed). */
export const DocumentEditModal: FC<{
  errandId: string;
  document: Document;
  onClose: () => void;
  onSaved: () => void;
}> = ({ errandId, document, onClose, onSaved }) => {
  const [fields, setFields] = useState<DocumentFieldValues>({
    heading: document.heading ?? '',
    documentDate: document.documentDate ?? todayDate(),
    documentTime: document.documentTime ?? '',
    text: document.text ?? '',
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const canSave = fields.heading.trim() !== '' && fields.documentDate !== '' && !saving;

  const save = async (): Promise<void> => {
    if (!document.id || !canSave) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const input: DocumentInput = {
      type: document.type ?? '',
      heading: fields.heading.trim(),
      text: fields.text.trim() || undefined,
      documentDate: fields.documentDate,
      documentTime: fields.documentTime || undefined,
    };
    const res = await updateDocument(errandId, document.id, input);
    setSaving(false);
    if (res.error) {
      setError('Det gick inte att spara ändringen');
      return;
    }
    onSaved();
  };

  return (
    <Modal show onClose={onClose} label="Redigera dokument" className="w-[43rem]">
      <Modal.Content className="flex flex-col gap-12">
        <DocumentFields
          value={fields}
          idPrefix="document-edit"
          onChange={(patch) => {
            setFields((prev) => ({ ...prev, ...patch }));
          }}
        />
        {error && <p className="text-error-surface-primary m-0">{error}</p>}
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Avbryt
        </Button>
        <Button color="vattjom" variant="primary" loading={saving} disabled={!canSave} onClick={() => void save()}>
          Spara
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
