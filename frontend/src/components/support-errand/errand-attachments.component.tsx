'use client';

import { PdfPreview } from '@components/common/pdf-preview.component';
import { useErrandAttachments } from '@hooks/use-errand-attachments';
import { uploadAttachment } from '@services/errand-service/errand-service';
import { CustomOnChangeEventUploadFile, FileUpload, Spinner } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { AttachmentList } from './attachment-list.component';

// The two consolidated PDFs caremanagement keeps on the errand, previewed inline at the top:
// sammanstallning.pdf = the submitted application summary; klientbilagor.pdf = every client-sent
// conversation file merged into one (rebuilt whenever the client sends a new attachment).
const SUMMARY_PDF = 'sammanstallning.pdf';
const CLIENT_FILES_PDF = 'klientbilagor.pdf';

export const ErrandAttachments: FC<{ errandId: string }> = ({ errandId }) => {
  const { attachments, isLoading, error, refresh } = useErrandAttachments(errandId);
  const formMethods = useForm();
  const [uploading, setUploading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>();

  const findByName = (fileName: string) =>
    attachments.find((attachment) => (attachment.fileName ?? '').toLowerCase() === fileName);
  const summaryAttachment = findByName(SUMMARY_PDF);
  const clientFilesAttachment = findByName(CLIENT_FILES_PDF);

  // Conversation files live in the dedicated "Bilagor från meddelanden" tab; here we show the rest
  // (application / generated / errand files).
  const errandAttachments = attachments.filter((attachment) => attachment.origin !== 'CONVERSATION');

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

  return (
    <FormProvider {...formMethods}>
      {summaryAttachment?.id ?
        <PdfPreview errandId={errandId} attachmentId={summaryAttachment.id} title="Sammanställning (PDF)" />
      : null}
      {clientFilesAttachment?.id ?
        <PdfPreview errandId={errandId} attachmentId={clientFilesAttachment.id} title="Klientbilagor (PDF)" />
      : null}

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
          : <AttachmentList errandId={errandId} attachments={errandAttachments} />}
        </div>
      </FileUpload.Area>
    </FormProvider>
  );
};
