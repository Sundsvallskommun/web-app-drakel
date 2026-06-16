'use client';

import { useErrandMessages } from '@hooks/use-errand-messages';
import { downloadMessageAttachment, Message, postErrandMessage } from '@services/errand-service/errand-service';
import {
  Button,
  CustomOnChangeEventUploadFile,
  Divider,
  FileUpload,
  FormControl,
  FormErrorMessage,
  Spinner,
  Textarea,
  UploadFile,
} from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { Download, SendHorizontal, X } from 'lucide-react';
import { FC, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

// Matches the backend CreateMessageDto / caremanagement CreateMessage.body limit.
const MESSAGE_CHARACTER_LIMIT = 8192;

const formatTimestamp = (created?: string): string => (created ? dayjs(created).format('YYYY-MM-DD HH:mm') : '—');

const senderLabel = (message: Message): string => {
  if (message.direction === 'OUTBOUND') {
    return message.author ? `${message.author} · Handläggare` : 'Handläggare';
  }
  return 'Sökande';
};

/** A single message bubble. OUTBOUND (handläggare) sits to the right, INBOUND (sökande) to the left. */
const MessageBubble: FC<{ message: Message; errandId: string }> = ({ message, errandId }) => {
  const outbound = message.direction === 'OUTBOUND';
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string>();
  const [downloadError, setDownloadError] = useState<string>();

  const downloadAttachment = async (attachmentId?: string, fileName?: string) => {
    if (!message.id || !attachmentId) {
      return;
    }
    setDownloadingAttachmentId(attachmentId);
    setDownloadError(undefined);
    try {
      await downloadMessageAttachment(errandId, message.id, attachmentId, fileName);
    } catch {
      setDownloadError('Det gick inte att hämta filen');
    } finally {
      setDownloadingAttachmentId(undefined);
    }
  };

  return (
    <li className={`flex flex-col max-w-[80%] ${outbound ? 'self-end items-end' : 'self-start items-start'}`}>
      <div className="flex items-center gap-8 mb-4 text-small text-secondary">
        <span className="font-bold">{senderLabel(message)}</span>
        <span>{formatTimestamp(message.created)}</span>
      </div>
      <div
        className={`rounded-12 px-16 py-12 whitespace-pre-wrap break-words ${
          outbound ? 'bg-primary-surface-accent-DEFAULT' : 'bg-background-200'
        }`}
      >
        {message.body}
      </div>
      {message.attachments?.length ?
        <ul className="mt-8 flex flex-col gap-4 items-stretch">
          {message.attachments.map((attachment, index) => (
            <li key={attachment.id ?? index}>
              <Button
                size="sm"
                variant="tertiary"
                leftIcon={<Download />}
                disabled={!message.id || !attachment.id}
                loading={downloadingAttachmentId === attachment.id}
                onClick={() => void downloadAttachment(attachment.id, attachment.fileName)}
              >
                {attachment.fileName ?? 'bilaga'}
              </Button>
            </li>
          ))}
        </ul>
      : null}
      {downloadError && <p className="mt-4 mb-0 text-small text-error-surface-primary">{downloadError}</p>}
    </li>
  );
};

export const ErrandMessages: FC<{ errandId: string }> = ({ errandId }) => {
  const { messages, isLoading, error, refresh } = useErrandMessages(errandId);
  const formMethods = useForm();
  const [body, setBody] = useState<string>('');
  const [pendingFiles, setPendingFiles] = useState<UploadFile[]>([]);
  const [sending, setSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>();

  const trimmed = body.trim();
  const isOverLimit = body.length > MESSAGE_CHARACTER_LIMIT;
  const canSend = trimmed.length > 0 && !isOverLimit && !sending;

  const addFiles = (event: CustomOnChangeEventUploadFile) => {
    const incoming = event.target.value ?? [];
    setPendingFiles((prev) => [...prev, ...incoming]);
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleSend = async () => {
    if (!canSend) {
      return;
    }
    setSending(true);
    setSendError(undefined);
    const result = await postErrandMessage(
      errandId,
      trimmed,
      pendingFiles.map((file) => file.file)
    );
    setSending(false);
    if (result.error) {
      setSendError('Det gick inte att skicka meddelandet');
      return;
    }
    setBody('');
    setPendingFiles([]);
    refresh();
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="text-secondary">
        <span>
          {messages.length ?
            `${messages.length} ${messages.length === 1 ? 'meddelande' : 'meddelanden'}`
          : 'Inga meddelanden'}
        </span>
        <Divider className="mx-0 mb-0 mt-16" />
      </div>

      {isLoading ?
        <Spinner size={3} />
      : error ?
        <p className="m-0">Det gick inte att hämta meddelanden ({String(error)})</p>
      : messages.length ?
        <ul aria-label="Ärendemeddelanden" className="flex flex-col gap-16">
          {messages.map((message, index) => (
            <MessageBubble key={message.id ?? index} message={message} errandId={errandId} />
          ))}
        </ul>
      : null}

      <Divider className="m-0" />

      <FormProvider {...formMethods}>
        <FormControl invalid={isOverLimit || Boolean(sendError)} className="flex flex-col gap-8">
          <Textarea
            aria-label="Nytt meddelande"
            placeholder="Skriv ett meddelande till den sökande…"
            rows={4}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
            }}
          />

          {pendingFiles.length ?
            <ul className="flex flex-col gap-4">
              {pendingFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-8 text-small">
                  <span className="truncate">{file.file.name}</span>
                  <Button
                    size="sm"
                    variant="tertiary"
                    iconButton
                    aria-label={`Ta bort ${file.file.name}`}
                    leftIcon={<X />}
                    onClick={() => {
                      removeFile(file.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          : null}

          <div className="flex items-center justify-between gap-12">
            <div className="flex items-center gap-12">
              <FileUpload.Button
                onChange={(event) => {
                  addFiles(event);
                }}
              />
              <span className={`text-small ${isOverLimit ? 'text-error-surface-primary' : 'text-secondary'}`}>
                {body.length} / {MESSAGE_CHARACTER_LIMIT}
              </span>
            </div>
            <Button
              variant="primary"
              loading={sending}
              disabled={!canSend}
              leftIcon={<SendHorizontal />}
              onClick={() => void handleSend()}
            >
              Skicka
            </Button>
          </div>
          {isOverLimit && <FormErrorMessage>Du får skriva max {MESSAGE_CHARACTER_LIMIT} tecken.</FormErrorMessage>}
          {sendError && <FormErrorMessage>{sendError}</FormErrorMessage>}
        </FormControl>
      </FormProvider>
    </div>
  );
};
