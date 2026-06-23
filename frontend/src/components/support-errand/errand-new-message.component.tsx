'use client';

import { Message, postErrandMessage } from '@services/errand-service/errand-service';
import { useUserStore } from '@services/user-service/user-service';
import {
  Button,
  CustomOnChangeEventUploadFile,
  FileUpload,
  FormControl,
  FormErrorMessage,
  Modal,
  Textarea,
  UploadFile,
} from '@sk-web-gui/react';
import { Eye, Paperclip, Reply, SendHorizontal, X } from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { isPreviewableMimeType, LocalFilePreviewModal } from './attachment-preview-modal.component';
import { messagePreview, senderLabel } from './errand-message.component';

// Matches the backend MESSAGE_BODY_MAX_LENGTH / caremanagement CreateMessage.body limit.
const MESSAGE_CHARACTER_LIMIT = 8192;
// Mirror the backend multer limits (MAX_MESSAGE_ATTACHMENT_FILES / MAX_UPLOAD_FILE_SIZE_BYTES).
const MAX_ATTACHMENT_FILES = 10;
const MAX_ATTACHMENT_FILE_SIZE_MB = 20;

const ALLOWED_FILE_TYPES = [
  '.jpeg',
  '.gif',
  '.png',
  '.tiff',
  '.bmp',
  '.pdf',
  '.rtf',
  '.doc',
  '.docx',
  '.txt',
  '.html',
  '.xls',
  '.xlsx',
  '.odt',
  '.ods',
  '.msg',
];

interface NewMessageForm {
  files: UploadFile[];
  message: string;
}

const uploadFileName = (file: UploadFile): string => {
  if (file.meta.name && file.meta.ending) {
    return `${file.meta.name}.${file.meta.ending}`;
  }
  return file.file.name;
};

/** Compose + send a new OUTBOUND message (text + optional attachments) to the errand conversation. */
export const ErrandNewMessage: FC<{
  errandId: string;
  onSent: () => void;
  /** When set, the message is posted as a reply to this message (its id is sent as inReplyToId). */
  replyTo?: Message;
  onCancelReply: () => void;
}> = ({ errandId, onSent, replyTo, onCancelReply }) => {
  const formMethods = useForm<NewMessageForm>({ defaultValues: { files: [], message: '' }, mode: 'onChange' });
  const [showFileTypes, setShowFileTypes] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<File>();
  const username = useUserStore(useShallow((state) => state.user.username));

  // useWatch (not formMethods.watch()) so the strict React-Compiler lint rule stays happy.
  const files = useWatch({ control: formMethods.control, name: 'files' });
  const message = useWatch({ control: formMethods.control, name: 'message' }) ?? '';
  const isOverLimit = message.length > MESSAGE_CHARACTER_LIMIT;
  const isOverFileLimit = files.length > MAX_ATTACHMENT_FILES;

  // Move focus into the textarea when the handläggare picks a message to reply to.
  useEffect(() => {
    if (replyTo) {
      formMethods.setFocus('message');
    }
  }, [replyTo, formMethods]);

  const messageRegister = formMethods.register('message', {
    validate: (value) => value.trim().length > 0 || 'Skriv ett meddelande',
  });

  const removeFile = (file: UploadFile) => {
    formMethods.setValue(
      'files',
      files.filter((f) => f !== file),
      { shouldDirty: true, shouldTouch: true, shouldValidate: true }
    );
  };

  const appendSelectedFiles = (event: CustomOnChangeEventUploadFile) => {
    formMethods.setValue('files', [...files, ...event.target.value], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit: SubmitHandler<NewMessageForm> = async (values) => {
    if (isOverLimit || isOverFileLimit) {
      return;
    }
    const result = await postErrandMessage(
      errandId,
      values.message.trim(),
      values.files.map((file) => file.file),
      replyTo?.id
    );
    if (result.error) {
      formMethods.setError('root', { type: 'manual', message: 'Det gick inte att skicka meddelandet' });
      return;
    }
    formMethods.reset();
    onSent();
  };

  return (
    <>
      <FormProvider {...formMethods}>
        <form className="flex flex-col gap-14" onSubmit={(event) => void formMethods.handleSubmit(onSubmit)(event)}>
          {replyTo ?
            <div className="flex items-start gap-8 rounded-12 border-l-4 border-vattjom-surface-primary bg-background-200 px-12 py-8">
              <Reply size={16} className="shrink-0 mt-2 text-secondary" />
              <div className="flex flex-col gap-y-2 min-w-0 grow">
                <span className="text-small font-bold">Svarar på {senderLabel(replyTo, username)}</span>
                <span className="text-small text-secondary line-clamp-2 break-words">{messagePreview(replyTo)}</span>
              </div>
              <Button
                variant="tertiary"
                size="sm"
                iconButton
                className="shrink-0"
                aria-label="Avbryt svar"
                onClick={onCancelReply}
              >
                <X size={18} />
              </Button>
            </div>
          : null}

          <div className="flex flex-col">
            <FormControl className="w-full" invalid={isOverLimit}>
              <Textarea
                {...messageRegister}
                aria-label="Nytt meddelande"
                placeholder={replyTo ? 'Skriv ett svar' : 'Skriv ett meddelande'}
                rows={3}
                className="w-full rounded-12"
                readOnly={formMethods.formState.isSubmitting}
              />
              <div className="flex justify-between gap-12 text-small mt-6">
                <span className="text-secondary">Max {MESSAGE_CHARACTER_LIMIT} tecken.</span>
                <span className={isOverLimit ? 'text-error-surface-primary' : 'text-secondary'}>
                  {message.length} / {MESSAGE_CHARACTER_LIMIT}
                </span>
              </div>
              {formMethods.formState.errors.message ?
                <FormErrorMessage>{formMethods.formState.errors.message.message}</FormErrorMessage>
              : null}
            </FormControl>

            <div className="flex flex-col gap-8 mt-10 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-8 text-small">
                <FileUpload.Button
                  name="files"
                  appendToContext={false}
                  maxFileSizeMB={MAX_ATTACHMENT_FILE_SIZE_MB}
                  onChange={appendSelectedFiles}
                  onInvalid={(error) => {
                    formMethods.setError('files', { type: 'manual', message: error });
                  }}
                  onValid={() => {
                    formMethods.clearErrors('files');
                  }}
                />
                <span className="text-secondary">Max {MAX_ATTACHMENT_FILE_SIZE_MB} MB per fil.</span>
              </div>
              <Button
                variant="link"
                onClick={() => {
                  setShowFileTypes(true);
                }}
              >
                Visa tillåtna filtyper
              </Button>
            </div>
            {formMethods.formState.errors.files ?
              <FormErrorMessage>{formMethods.formState.errors.files.message}</FormErrorMessage>
            : null}
            {isOverFileLimit ?
              <FormErrorMessage>Du kan bifoga max {MAX_ATTACHMENT_FILES} filer.</FormErrorMessage>
            : null}
          </div>

          {files.length ?
            <section className="flex flex-col gap-8" aria-label="Valda bilagor">
              <div className="flex items-baseline justify-between gap-12">
                <h3 className="text-small font-bold m-0">Valda bilagor</h3>
                <span className="text-small text-secondary">
                  {files.length} / {MAX_ATTACHMENT_FILES} filer
                </span>
              </div>
              <ul className="m-0 w-full rounded-8 border-1 border-divider bg-background-100 p-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.id ?? file.file.name}-${index}`}
                    className="min-w-0 rounded-8 border-1 border-divider bg-background-content px-10 py-8 flex items-center gap-8"
                  >
                    <Paperclip size={16} className="shrink-0 text-secondary" />
                    <span className="min-w-0 flex-1 truncate text-small" title={uploadFileName(file)}>
                      {uploadFileName(file)}
                    </span>
                    {isPreviewableMimeType(file.file.type) ?
                      <Button
                        type="button"
                        variant="tertiary"
                        size="sm"
                        iconButton
                        className="shrink-0"
                        aria-label={`Förhandsgranska ${uploadFileName(file)}`}
                        onClick={() => {
                          setPreviewFile(file.file);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                    : null}
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      iconButton
                      className="shrink-0"
                      aria-label={`Ta bort ${uploadFileName(file)}`}
                      onClick={() => {
                        removeFile(file);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          : null}

          <div className="flex flex-col gap-8 items-end">
            <Button
              type="submit"
              color="vattjom"
              size="md"
              className="w-full md:w-fit"
              rightIcon={<SendHorizontal />}
              loading={formMethods.formState.isSubmitting}
              disabled={isOverLimit || isOverFileLimit}
            >
              {replyTo ? 'Skicka svar' : 'Skicka'}
            </Button>
            {formMethods.formState.errors.root ?
              <FormErrorMessage>{formMethods.formState.errors.root.message}</FormErrorMessage>
            : null}
          </div>
        </form>
      </FormProvider>

      <LocalFilePreviewModal
        file={previewFile}
        onClose={() => {
          setPreviewFile(undefined);
        }}
      />

      <Modal
        show={showFileTypes}
        onClose={() => {
          setShowFileTypes(false);
        }}
        label="Tillåtna filtyper"
        className="w-full max-w-[433px]"
      >
        <Modal.Content>
          <ul className="text-secondary space-y-3">
            {ALLOWED_FILE_TYPES.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        </Modal.Content>
      </Modal>
    </>
  );
};
