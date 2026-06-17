'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { getUnifiedAttachmentBlob } from '@services/errand-service/errand-service';
import { useEffect, useState } from 'react';

// The mime types sk-web-gui's FileUpload renders as an image thumbnail (mirrors its internal defaults).
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/gif', 'image/png', 'image/tiff', 'image/bmp']);

/** True when sk-web-gui's FileUpload would render an image thumbnail for this attachment. */
const isImageAttachment = (attachment: Attachment): boolean => IMAGE_MIME_TYPES.has(attachment.mimeType ?? '');

/**
 * Fetches the real bytes for every image attachment so FileUpload.ListItem can render a thumbnail.
 * The list only carries metadata, so it passes placeholder (0-byte) Files — but the thumbnail is built
 * by FileReader from the File's bytes, and an empty File yields a broken preview. This loads the actual
 * content for images (best-effort) and returns a map of attachmentId → File (only successful loads).
 */
export const useAttachmentImagePreviews = (errandId: string, attachments: Attachment[]): Record<string, File> => {
  const [previews, setPreviews] = useState<Record<string, File>>({});

  // Only image ids drive the fetch — joined into a stable key so the effect doesn't refetch on
  // unrelated attachment-list changes.
  const imageAttachmentIds = attachments
    .filter(isImageAttachment)
    .map((attachment) => attachment.id ?? '')
    .join(',');

  useEffect(() => {
    let active = true;
    attachments.filter(isImageAttachment).forEach((attachment) => {
      const attachmentId = attachment.id;
      if (!attachmentId) {
        return;
      }
      void getUnifiedAttachmentBlob(errandId, attachment)
        .then((blob) => {
          if (!active) {
            return;
          }
          const file = new File([blob], attachment.fileName ?? 'bild', { type: attachment.mimeType });
          setPreviews((current) => ({ ...current, [attachmentId]: file }));
        })
        .catch(() => {
          // Preview is best-effort — on failure FileUpload falls back to the generic image icon.
        });
    });
    return () => {
      active = false;
    };
  }, [errandId, imageAttachmentIds]);

  return previews;
};
