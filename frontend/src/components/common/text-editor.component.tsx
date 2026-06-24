'use client';

import dynamic from 'next/dynamic';

/**
 * sk-web-gui's Quill-based WYSIWYG editor. Loaded client-side only — Quill touches `document` on import,
 * which would break server-side rendering.
 */
const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), {
  ssr: false,
  loading: () => <div className="h-[20rem] w-full animate-pulse rounded-12 bg-background-200" />,
});

export default TextEditor;
