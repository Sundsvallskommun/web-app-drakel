'use client';

import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { useErrandAttachments } from '@hooks/use-errand-attachments';
import { downloadAttachment, uploadAttachment } from '@services/errand-service/errand-service';
import { Button, CustomOnChangeEventUploadFile, FileUpload, Spinner, UploadFile } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { Download } from 'lucide-react';
import { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

const formatSize = (bytes?: number): string => {
  if (!bytes) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} kB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// Map a server-side caremanagement attachment onto sk-web-gui's UploadFile shape for FileUpload.List.
const toUploadFile = (attachment: Attachment): UploadFile => {
  const fileName = attachment.fileName ?? 'bilaga';
  const dotIndex = fileName.lastIndexOf('.');
  const name = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const ending = dotIndex > 0 ? fileName.slice(dotIndex + 1) : '';
  return {
    id: attachment.id ?? '',
    file: new File([], fileName, { type: attachment.mimeType }),
    meta: { name, ending, created: attachment.created, size: attachment.fileSize },
  };
};

export const ErrandAttachments: FC<{ errandId: string }> = ({ errandId }) => {
  const { attachments, isLoading, error, refresh } = useErrandAttachments(errandId);
  const formMethods = useForm();

  // caremanagement genererar en sammanslagen PDF (sammanstallning.pdf) av alla bilagor — visa den
  // som inline-förhandsgranskning högst upp om den finns på ärendet.
  const summaryAttachment = attachments.find(
    (attachment) => (attachment.fileName ?? '').toLowerCase() === 'sammanstallning.pdf',
  );
  const [uploading, setUploading] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const handleUpload = async (event: CustomOnChangeEventUploadFile) => {
    const file = event.target.value?.[0]?.file;
    if (!file) {
      return;
    }
    setUploading(true);
    setActionError(undefined);
    const result = await uploadAttachment(errandId, file);
    setUploading(false);
    if (result.error) {
      setActionError('Det gick inte att ladda upp filen');
      return;
    }
    refresh();
  };

  const download = async (attachmentId?: string, fileName?: string) => {
    if (!attachmentId) {
      return;
    }
    setDownloadingId(attachmentId);
    setActionError(undefined);
    try {
      await downloadAttachment(errandId, attachmentId, fileName);
    } catch {
      setActionError('Det gick inte att hämta filen');
    } finally {
      setDownloadingId(undefined);
    }
  };

  return (
    <FormProvider {...formMethods}>
      {summaryAttachment?.id ? (
        <PdfPreview errandId={errandId} attachmentId={summaryAttachment.id} title="Sammanställning (PDF)" />
      ) : null}

      <FileUpload.Area onChange={(event) => void handleUpload(event)}>
        <div className="flex flex-col gap-16">
          <div className="flex items-center justify-between gap-12">
            <span className="font-bold">Bilagor</span>
            <div className="flex items-center gap-12">
              {uploading && <Spinner size={2} />}
              <FileUpload.Button onChange={(event) => void handleUpload(event)} />
            </div>
          </div>

          {actionError && <p className="text-error-surface-primary m-0">{actionError}</p>}

          {isLoading ?
            <Spinner size={3} />
          : error ?
            <p className="m-0">Det gick inte att hämta bilagor ({String(error)})</p>
          : <FileUpload.List placeholder="Inga bilagor">
              {attachments.map((attachment, index) => (
                <FileUpload.ListItem
                  key={attachment.id ?? index}
                  index={index}
                  file={toUploadFile(attachment)}
                  nameProps={{
                    description: `Uppladdad: ${
                      attachment.created ? dayjs(attachment.created).format('YYYY-MM-DD HH:mm') : '—'
                    } · ${formatSize(attachment.fileSize)}`,
                  }}
                  actionsProps={{
                    extraActions: (
                      <Button
                        size="sm"
                        variant="tertiary"
                        iconButton
                        aria-label={`Ladda ner ${attachment.fileName ?? 'bilaga'}`}
                        loading={downloadingId === attachment.id}
                        onClick={() => void download(attachment.id, attachment.fileName)}
                        leftIcon={<Download />}
                      />
                    ),
                  }}
                />
              ))}
            </FileUpload.List>
          }
        </div>
      </FileUpload.Area>
    </FormProvider>
  );
};
