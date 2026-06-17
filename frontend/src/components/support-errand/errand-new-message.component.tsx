'use client';

import { postErrandMessage } from '@services/errand-service/errand-service';
import { Button, FileUpload, FormControl, FormErrorMessage, Modal, Textarea, UploadFile } from '@sk-web-gui/react';
import { SendHorizontal } from 'lucide-react';
import { FC, useState } from 'react';
import { FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';

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

/** Compose + send a new OUTBOUND message (text + optional attachments) to the errand conversation. */
export const ErrandNewMessage: FC<{ errandId: string; onSent: () => void }> = ({ errandId, onSent }) => {
  const formMethods = useForm<NewMessageForm>({ defaultValues: { files: [], message: '' }, mode: 'onChange' });
  const [showFileTypes, setShowFileTypes] = useState<boolean>(false);

  // useWatch (not formMethods.watch()) so the strict React-Compiler lint rule stays happy.
  const files = useWatch({ control: formMethods.control, name: 'files' });
  const message = useWatch({ control: formMethods.control, name: 'message' }) ?? '';
  const isOverLimit = message.length > MESSAGE_CHARACTER_LIMIT;
  const isOverFileLimit = files.length > MAX_ATTACHMENT_FILES;

  const messageRegister = formMethods.register('message', {
    validate: (value) => value.trim().length > 0 || 'Skriv ett meddelande',
  });

  const removeFile = (file: UploadFile) => {
    formMethods.setValue(
      'files',
      files.filter((f) => f !== file)
    );
  };

  const onSubmit: SubmitHandler<NewMessageForm> = async (values) => {
    if (isOverLimit || isOverFileLimit) {
      return;
    }
    const result = await postErrandMessage(
      errandId,
      values.message.trim(),
      values.files.map((file) => file.file)
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
          <div className="flex flex-col">
            <FormControl className="w-full" invalid={isOverLimit}>
              <Textarea
                {...messageRegister}
                aria-label="Nytt meddelande"
                placeholder="Skriv ett meddelande"
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

            <div className="flex flex-col gap-8 mt-10 desktop:flex-row desktop:items-center desktop:justify-between">
              <div className="flex flex-wrap items-center gap-8 text-small">
                <FileUpload.Button
                  {...formMethods.register('files')}
                  appendFiles={files}
                  maxFileSizeMB={MAX_ATTACHMENT_FILE_SIZE_MB}
                  onInvalid={(error) => {
                    formMethods.setError('files', { type: 'manual', message: error });
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
            <div className="flex flex-col gap-16">
              <h3 className="text-large font-normal m-0">Valda filer</h3>
              <FileUpload.List name="files" showBorder>
                {files.map((file, index) => (
                  <FileUpload.ListItem
                    key={`${file.id ?? file.file.name}-${index}`}
                    className="break-all"
                    index={index}
                    file={file}
                    actionsProps={{
                      showRemove: true,
                      onRemove: () => {
                        removeFile(file);
                      },
                    }}
                  />
                ))}
              </FileUpload.List>
            </div>
          : null}

          <div className="flex flex-col gap-8 items-end">
            <Button
              type="submit"
              color="vattjom"
              size="md"
              className="w-full desktop:w-fit"
              rightIcon={<SendHorizontal />}
              loading={formMethods.formState.isSubmitting}
              disabled={isOverLimit || isOverFileLimit}
            >
              Skicka
            </Button>
            {formMethods.formState.errors.root ?
              <FormErrorMessage>{formMethods.formState.errors.root.message}</FormErrorMessage>
            : null}
          </div>
        </form>
      </FormProvider>

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
