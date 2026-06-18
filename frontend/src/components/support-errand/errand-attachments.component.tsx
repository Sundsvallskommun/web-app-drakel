'use client';

import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { uploadAttachment } from '@services/errand-service/errand-service';
import { CustomOnChangeEventUploadFile, FileUpload, Spinner } from '@sk-web-gui/react';
import { SUMMARY_PDF } from '@utils/attachment-names';
import { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { AttachmentList } from './attachment-list.component';

interface ErrandAttachmentsProps {
  errandId: string;
  /** The errand-level attachments (application / generated / errand files; conversation files excluded). */
  attachments: Attachment[];
  isLoading: boolean;
  loadError: boolean;
  refresh: () => void;
}

export const ErrandAttachments: FC<ErrandAttachmentsProps> = ({
  errandId,
  attachments,
  isLoading,
  loadError,
  refresh,
}) => {
  const formMethods = useForm();
  const [uploading, setUploading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>();

  const summaryAttachment = attachments.find(
    (attachment) => (attachment.fileName ?? '').toLowerCase() === SUMMARY_PDF
  );

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
          : loadError ?
            <p className="m-0">Det gick inte att hämta bilagor</p>
          : <AttachmentList errandId={errandId} attachments={attachments} />}
        </div>
      </FileUpload.Area>
    </FormProvider>
  );
};
