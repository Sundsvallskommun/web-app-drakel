'use client';

import { createDocument, DocumentInput, DocumentType } from '@services/document-service';
import { Button, FormControl, FormLabel, Modal, Select } from '@sk-web-gui/react';
import { FC, useState } from 'react';

import { DocumentFields, DocumentFieldValues } from './document-fields.component';
import { todayDate } from './journal-entry-fields.component';

/** Modal for adding a new dokument (type dropdown + shared fields). */
export const DocumentCreateModal: FC<{
  errandId: string;
  types: DocumentType[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ errandId, types, onClose, onCreated }) => {
  const [type, setType] = useState<string>('');
  const [fields, setFields] = useState<DocumentFieldValues>({
    heading: '',
    documentDate: todayDate(),
    documentTime: '',
    text: '',
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const canCreate = type !== '' && fields.heading.trim() !== '' && fields.documentDate !== '' && !saving;

  const create = async (): Promise<void> => {
    if (!canCreate) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const input: DocumentInput = {
      type,
      heading: fields.heading.trim(),
      text: fields.text.trim() || undefined,
      documentDate: fields.documentDate,
      documentTime: fields.documentTime || undefined,
    };
    const res = await createDocument(errandId, input);
    setSaving(false);
    if (res.error) {
      setError('Det gick inte att spara dokumentet');
      return;
    }
    onCreated();
  };

  return (
    <Modal show onClose={onClose} label="Nytt dokument" className="w-[43rem]">
      <Modal.Content className="flex flex-col gap-12">
        <FormControl id="document-new-type" className="w-full">
          <FormLabel>Typ *</FormLabel>
          <Select
            className="w-full"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
            }}
          >
            <Select.Option value="">Välj typ</Select.Option>
            {types.map((documentType) => (
              <Select.Option key={documentType.code} value={documentType.displayName ?? ''}>
                {documentType.displayName ?? documentType.code}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
        <DocumentFields
          value={fields}
          idPrefix="document-new"
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
        <Button color="vattjom" variant="primary" loading={saving} disabled={!canCreate} onClick={() => void create()}>
          Skapa
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
