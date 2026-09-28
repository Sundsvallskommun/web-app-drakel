'use client';

import { Button } from '@sk-web-gui/react';
import { FileText, Paperclip, Plus, X } from 'lucide-react';
import { FC, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LifecareDocumentChoice, LifecareDocumentPicker } from './lifecare-document-picker.component';

/**
 * What goes with the message: Lifecare's beslut and beräkning (in unless taken out), the documents the handläggare picked
 * from Lifecare, and their own files.
 */
export interface DecisionAttachments {
  includeDecision: boolean;
  includeCalculation: boolean;
  lifecareDocuments: LifecareDocumentChoice[];
  files: File[];
}

const AttachmentRow: FC<{ name: string; removeLabel: string; onRemove: () => void }> = ({
  name,
  removeLabel,
  onRemove,
}) => (
  <li className="flex items-center gap-12 rounded-8 border-1 border-divider px-12 py-8">
    <FileText className="shrink-0 w-20 h-20 text-dark-secondary" aria-hidden />
    <span className="min-w-0 flex-1 truncate" title={name}>
      {name}
    </span>
    <Button size="sm" variant="tertiary" iconButton aria-label={removeLabel} leftIcon={<X />} onClick={onRemove} />
  </li>
);

/**
 * The documents that go with "Skicka beräkning och beslut": the beslut and the beräkning from Lifecare are in to
 * begin with, and the handläggare can take them out, add them back, add the sökandes stored PDFs from Lifecare and
 * add and remove PDFs from their computer.
 */
export const SendDecisionAttachments: FC<{
  errandId: string;
  value: DecisionAttachments;
  onChange: (value: DecisionAttachments) => void;
}> = ({ errandId, value, onChange }) => {
  const { t } = useTranslation('errand');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const nothing =
    !value.includeDecision &&
    !value.includeCalculation &&
    value.lifecareDocuments.length === 0 &&
    value.files.length === 0;
  const removeLabel = (name: string): string => t('decideAndPay.attachments.remove', { name });

  return (
    <div className="flex flex-col gap-12">
      <span className="text-small font-bold">{t('decideAndPay.attachments.title')}</span>
      <p className="m-0 text-small text-dark-secondary">{t('decideAndPay.attachments.help')}</p>
      {nothing ?
        <p className="m-0 text-small text-dark-secondary">{t('decideAndPay.attachments.none')}</p>
      : <ul className="m-0 p-0 list-none flex flex-col gap-8" aria-label={t('decideAndPay.attachments.title')}>
          {value.includeDecision ?
            <AttachmentRow
              name={t('decideAndPay.attachments.decision')}
              removeLabel={removeLabel(t('decideAndPay.attachments.decision'))}
              onRemove={() => {
                onChange({ ...value, includeDecision: false });
              }}
            />
          : null}
          {value.includeCalculation ?
            <AttachmentRow
              name={t('decideAndPay.attachments.calculation')}
              removeLabel={removeLabel(t('decideAndPay.attachments.calculation'))}
              onRemove={() => {
                onChange({ ...value, includeCalculation: false });
              }}
            />
          : null}
          {value.lifecareDocuments.map((document) => {
            const name = t('decideAndPay.attachments.fromLifecareName', { name: document.title });
            return (
              <AttachmentRow
                key={document.id}
                name={name}
                removeLabel={removeLabel(name)}
                onRemove={() => {
                  onChange({
                    ...value,
                    lifecareDocuments: value.lifecareDocuments.filter((chosen) => chosen.id !== document.id),
                  });
                }}
              />
            );
          })}
          {value.files.map((file, index) => (
            <AttachmentRow
              key={`${file.name}-${String(index)}`}
              name={file.name}
              removeLabel={removeLabel(file.name)}
              onRemove={() => {
                onChange({ ...value, files: value.files.filter((_, position) => position !== index) });
              }}
            />
          ))}
        </ul>
      }

      <div className="flex flex-wrap items-center gap-8">
        {value.includeDecision ? null : (
          <Button
            size="sm"
            variant="tertiary"
            leftIcon={<Plus />}
            onClick={() => {
              onChange({ ...value, includeDecision: true });
            }}
          >
            {t('decideAndPay.attachments.addDecision')}
          </Button>
        )}
        {value.includeCalculation ? null : (
          <Button
            size="sm"
            variant="tertiary"
            leftIcon={<Plus />}
            onClick={() => {
              onChange({ ...value, includeCalculation: true });
            }}
          >
            {t('decideAndPay.attachments.addCalculation')}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Paperclip />}
          aria-expanded={pickerOpen}
          onClick={() => {
            setPickerOpen((open) => !open);
          }}
        >
          {t('decideAndPay.attachments.fromLifecare')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Paperclip />}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          {t('decideAndPay.attachments.fromComputer')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          aria-label={t('decideAndPay.attachments.fromComputer')}
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? []);
            onChange({ ...value, files: [...value.files, ...picked] });
            event.target.value = '';
          }}
        />
      </div>
      {pickerOpen ?
        <LifecareDocumentPicker
          errandId={errandId}
          chosenIds={value.lifecareDocuments.map((document) => document.id)}
          onPick={(document) => {
            onChange({ ...value, lifecareDocuments: [...value.lifecareDocuments, document] });
          }}
        />
      : null}
      <p className="m-0 text-small text-dark-secondary">{t('decideAndPay.attachments.lifecareHelp')}</p>
    </div>
  );
};
