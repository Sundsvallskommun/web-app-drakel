'use client';

import { uploadAttachment } from '@services/errand-service/errand-service';
import { CustomOnChangeEventUploadFile, FileUpload, Spinner } from '@sk-web-gui/react';
import { ALLOWED_ATTACHMENT_FILE_EXTENSIONS, MAX_ATTACHMENT_FILE_SIZE_MB } from '@utils/attachment-upload-limits';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ALLOWED_EXTENSIONS_TEXT = ALLOWED_ATTACHMENT_FILE_EXTENSIONS.join(', ');

interface AttachmentUploadFieldProps {
  errandId: string;
  /** Called after a successful upload so the parent can re-fetch the attachment list. */
  onUploaded: () => void;
}

/**
 * "Ladda upp bilaga": sk-web-gui's drag-and-drop file field that uploads the chosen file straight to the
 * errand (one file per pick). sk-web-gui validates type and size before anything is sent; its long
 * mime-type restriction text is hidden in favour of the readable extension list underneath.
 */
export const AttachmentUploadField: FC<AttachmentUploadFieldProps> = ({ errandId, onUploaded }) => {
  const { t } = useTranslation('attachments');
  const [uploadingFileName, setUploadingFileName] = useState<string>();
  const [error, setError] = useState<string>();

  const upload = async (event: CustomOnChangeEventUploadFile) => {
    const file = event.target.value[0]?.file;
    if (!file || uploadingFileName) {
      return;
    }
    setUploadingFileName(file.name);
    setError(undefined);
    const result = await uploadAttachment(errandId, file);
    setUploadingFileName(undefined);
    if (result.error) {
      setError(t('upload.uploadError', { fileName: file.name }));
      return;
    }
    onUploaded();
  };

  return (
    <div className="flex flex-col gap-8">
      <span className="font-bold text-dark-primary" id="attachment-upload-label">
        {t('upload.label')}
      </span>
      <FileUpload.Field
        name="errandAttachmentUpload"
        aria-labelledby="attachment-upload-label"
        allowMultiple={false}
        appendToContext={false}
        maxFileSizeMB={MAX_ATTACHMENT_FILE_SIZE_MB}
        invalid={!!error}
        className="w-full [&_.sk-form-file-upload-field-button-content-restrictions]:hidden [&_.sk-form-file-upload-field-button]:py-16"
        onChange={(event) => void upload(event)}
        onInvalid={(message) => {
          // sk-web-gui's (Swedish) file type message lists every accepted mime type; show the readable list instead.
          setError(
            message.startsWith('Filtypen') ?
              t('upload.unsupportedFileType', { extensions: ALLOWED_EXTENSIONS_TEXT })
            : message
          );
        }}
      />
      <span className="text-small text-dark-secondary">
        {t('upload.restrictions', { extensions: ALLOWED_EXTENSIONS_TEXT, maxSizeMb: MAX_ATTACHMENT_FILE_SIZE_MB })}
      </span>
      {uploadingFileName ?
        <span className="flex items-center gap-8 text-small text-dark-secondary" role="status">
          <Spinner size={2} />
          {t('upload.uploading', { fileName: uploadingFileName })}
        </span>
      : null}
      {error ?
        <p className="m-0 text-small text-error-surface-primary" role="alert">
          {error}
        </p>
      : null}
    </div>
  );
};
