'use client';

import { Message, postErrandMessage } from '@services/errand-service/errand-service';
import { useUserStore } from '@services/user-service/user-service';
import {
  Button,
  CustomOnChangeEventUploadFile,
  FileUpload,
  FormErrorMessage,
  Modal,
  UploadFile,
} from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { ALLOWED_ATTACHMENT_FILE_EXTENSIONS, MAX_ATTACHMENT_FILE_SIZE_MB } from '@utils/attachment-upload-limits';
import { Eye, Paperclip, Reply, SendHorizontal, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FC, useRef, useState } from 'react';
import { FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { isPreviewableMimeType, LocalFilePreviewModal } from './attachment-preview-modal.component';
import { messagePreview, senderLabel } from './errand-message.component';

// Matches the backend MESSAGE_BODY_MAX_LENGTH / caremanagement CreateMessage.body limit.
const MESSAGE_CHARACTER_LIMIT = 8192;
// Mirrors the backend multer limit MAX_MESSAGE_ATTACHMENT_FILES (the per-file size limit is shared).
const MAX_ATTACHMENT_FILES = 10;

const EMPTY_MESSAGE: TextEditorValue = { markup: '', plainText: '' };

// Quill touches `document` on import, so the editor is loaded client-side only.
const MessageEditor = dynamic(() => import('./message-editor.component'), {
  ssr: false,
  loading: () => <div className="h-[9.8rem] w-full animate-pulse rounded-12 bg-background-200" />,
});

interface NewMessageForm {
  files: UploadFile[];
}

const uploadFileName = (file: UploadFile): string => {
  if (file.meta.name && file.meta.ending) {
    return `${file.meta.name}.${file.meta.ending}`;
  }
  return file.file.name;
};

/**
 * Compose + send a new OUTBOUND message (formatted text, sent as HTML, + optional attachments) to the errand
 * conversation. The editor toolbar's image button opens the file picker to attach files.
 */
export const ErrandNewMessage: FC<{
  errandId: string;
  onSent: () => void;
  /** When set, the message is posted as a reply to this message (its id is sent as inReplyToId). */
  replyTo?: Message;
  onCancelReply: () => void;
}> = ({ errandId, onSent, replyTo, onCancelReply }) => {
  const { t } = useTranslation('messages');
  const formMethods = useForm<NewMessageForm>({ defaultValues: { files: [] }, mode: 'onChange' });
  const [messageValue, setMessageValue] = useState<TextEditorValue>(EMPTY_MESSAGE);
  const [emptyMessageError, setEmptyMessageError] = useState<boolean>(false);
  const fileUploadContainerRef = useRef<HTMLDivElement>(null);
  const [showFileTypes, setShowFileTypes] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<File>();
  const currentUser = useUserStore(useShallow((state) => ({ username: state.user.username, name: state.user.name })));

  // useWatch (not formMethods.watch()) so the strict React-Compiler lint rule stays happy.
  const files = useWatch({ control: formMethods.control, name: 'files' });
  // The body is sent as HTML, so the backend's character limit applies to the markup.
  const messageMarkup = messageValue.markup ?? '';
  const hasText = (messageValue.plainText ?? '').trim().length > 0;
  const isOverLimit = messageMarkup.length > MESSAGE_CHARACTER_LIMIT;
  const isOverFileLimit = files.length > MAX_ATTACHMENT_FILES;

  const openFilePicker = () => {
    fileUploadContainerRef.current?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  };

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
    if (!hasText) {
      setEmptyMessageError(true);
      return;
    }
    if (isOverLimit || isOverFileLimit) {
      return;
    }
    const result = await postErrandMessage(
      errandId,
      messageMarkup,
      values.files.map((file) => file.file),
      replyTo?.id
    );
    if (result.error) {
      formMethods.setError('root', { type: 'manual', message: t('newMessage.sendError') });
      return;
    }
    formMethods.reset();
    setMessageValue(EMPTY_MESSAGE);
    onSent();
  };

  return (
    <>
      <FormProvider {...formMethods}>
        <form className="flex flex-col gap-16" onSubmit={(event) => void formMethods.handleSubmit(onSubmit)(event)}>
          {replyTo ?
            <div className="flex items-start gap-8 rounded-8 border-l-4 border-vattjom-surface-primary bg-background-color-mixin-1 px-12 py-8">
              <Reply size={16} className="shrink-0 mt-2 text-dark-secondary" />
              <div className="flex flex-col gap-y-2 min-w-0 grow">
                <span className="text-small font-bold">
                  {t('message.replyingTo', { sender: senderLabel(replyTo, t, currentUser) })}
                </span>
                <span className="text-small text-dark-secondary line-clamp-2 break-words">
                  {messagePreview(replyTo, t)}
                </span>
              </div>
              <Button
                variant="tertiary"
                size="sm"
                iconButton
                className="shrink-0"
                aria-label={t('newMessage.cancelReply')}
                onClick={onCancelReply}
              >
                <X size={18} />
              </Button>
            </div>
          : null}

          <div className="flex flex-col gap-8">
            {/* The send button sits inside the editor box, bottom right (the editor reserves room for it). */}
            <div className="relative">
              <MessageEditor
                value={messageValue}
                placeholder={replyTo ? t('newMessage.replyPlaceholder') : t('newMessage.placeholder')}
                readOnly={formMethods.formState.isSubmitting}
                focusKey={replyTo?.id}
                onAttachClick={openFilePicker}
                onChange={(value) => {
                  setMessageValue(value);
                  setEmptyMessageError(false);
                }}
              />
              <Button
                type="submit"
                color="vattjom"
                size="sm"
                className="absolute bottom-12 right-12"
                rightIcon={<SendHorizontal />}
                loading={formMethods.formState.isSubmitting}
                disabled={isOverLimit || isOverFileLimit}
              >
                {replyTo ? t('newMessage.sendReply') : t('common:send')}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-4 text-small text-dark-secondary">
              <span className="flex flex-wrap items-center gap-x-12">
                {t('newMessage.maxFileSize', { maxSizeMb: MAX_ATTACHMENT_FILE_SIZE_MB })}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setShowFileTypes(true);
                  }}
                >
                  {t('newMessage.showAllowedFileTypes')}
                </Button>
              </span>
              {/* Only surface the counter as the message approaches the limit. */}
              {messageMarkup.length > MESSAGE_CHARACTER_LIMIT * 0.8 ?
                <span className={isOverLimit ? 'text-error-surface-primary' : undefined}>
                  {t('newMessage.characterCount', { length: messageMarkup.length, limit: MESSAGE_CHARACTER_LIMIT })}
                </span>
              : null}
            </div>

            {emptyMessageError ?
              <FormErrorMessage>{t('newMessage.emptyError')}</FormErrorMessage>
            : null}
            {isOverLimit ?
              <FormErrorMessage>{t('newMessage.overLimit', { limit: MESSAGE_CHARACTER_LIMIT })}</FormErrorMessage>
            : null}
            {formMethods.formState.errors.root ?
              <FormErrorMessage>{formMethods.formState.errors.root.message}</FormErrorMessage>
            : null}
            {formMethods.formState.errors.files ?
              <FormErrorMessage>{formMethods.formState.errors.files.message}</FormErrorMessage>
            : null}
            {isOverFileLimit ?
              <FormErrorMessage>{t('newMessage.tooManyFiles', { maxFiles: MAX_ATTACHMENT_FILES })}</FormErrorMessage>
            : null}

            {/* The file input is driven by the editor toolbar's image button (see openFilePicker). */}
            <div ref={fileUploadContainerRef} className="hidden">
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
            </div>
          </div>

          {files.length ?
            <section className="flex flex-col gap-8" aria-label={t('newMessage.selectedAttachments')}>
              <div className="flex items-baseline justify-between gap-12">
                <h4 className="text-small font-bold m-0">{t('newMessage.selectedAttachments')}</h4>
                <span className="text-small text-dark-secondary">
                  {t('newMessage.fileCount', { selected: files.length, maxFiles: MAX_ATTACHMENT_FILES })}
                </span>
              </div>
              <ul className="m-0 p-0 w-full flex flex-wrap gap-16">
                {files.map((file, index) => (
                  <li
                    key={`${file.id ?? file.file.name}-${index}`}
                    className="min-w-0 w-full sm:w-[275px] rounded-8 border-1 border-divider px-12 py-8 flex items-center gap-8"
                  >
                    <Paperclip size={16} className="shrink-0 text-dark-secondary" />
                    <span className="min-w-0 flex-1 truncate text-dark-secondary" title={uploadFileName(file)}>
                      {uploadFileName(file)}
                    </span>
                    {isPreviewableMimeType(file.file.type) ?
                      <Button
                        type="button"
                        variant="tertiary"
                        size="sm"
                        iconButton
                        className="shrink-0"
                        aria-label={t('newMessage.previewFile', { fileName: uploadFileName(file) })}
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
                      aria-label={t('newMessage.removeFile', { fileName: uploadFileName(file) })}
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
        label={t('newMessage.allowedFileTypes')}
        className="w-full max-w-[433px]"
      >
        <Modal.Content>
          <ul className="text-secondary space-y-3">
            {ALLOWED_ATTACHMENT_FILE_EXTENSIONS.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        </Modal.Content>
      </Modal>
    </>
  );
};
