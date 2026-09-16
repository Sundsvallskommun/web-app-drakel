'use client';

import { File as FileIcon } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

interface AttachmentFileIconProps {
  /** An image's fetched bytes; when set the tile shows a thumbnail instead of the file icon. */
  thumbnail?: File;
}

/** The square light-blue tile at the start of an attachment row: a file icon, or a thumbnail for images. */
export const AttachmentFileIcon: FC<AttachmentFileIconProps> = ({ thumbnail }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>();

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailUrl(undefined);
      return;
    }
    const objectUrl = window.URL.createObjectURL(thumbnail);
    setThumbnailUrl(objectUrl);
    return () => {
      window.URL.revokeObjectURL(objectUrl);
    };
  }, [thumbnail]);

  return (
    <div
      className="flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-8 bg-vattjom-surface-accent text-dark-primary"
      aria-hidden
    >
      {thumbnailUrl ?
        // eslint-disable-next-line @next/next/no-img-element -- transient blob object URL; next/image adds nothing here.
        <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
      : <FileIcon size={26} strokeWidth={1.75} />}
    </div>
  );
};
