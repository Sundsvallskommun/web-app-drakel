import { looksLikeHtml, sanitizeHtml } from '@utils/sanitize-html';
import { FC } from 'react';

/** Free text of a journal entry, document or message: sanitized HTML from the editor, or plain text as-is. */
export const RecordBodyText: FC<{ text?: string }> = ({ text }) => {
  if (!text) {
    return null;
  }
  return looksLikeHtml(text) ?
      <div
        className="m-0 break-words [&_p]:m-0 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-24 [&_ol]:pl-24"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
      />
    : <p className="m-0 break-words whitespace-pre-wrap">{text}</p>;
};
