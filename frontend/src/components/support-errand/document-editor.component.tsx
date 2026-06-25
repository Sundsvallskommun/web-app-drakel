'use client';

import TextEditor, { TextEditorValue } from '@sk-web-gui/text-editor';
import type Quill from 'quill';
import { FC, useEffect, useRef } from 'react';

/**
 * The rich-text body for the new-document editor. Imported via next/dynamic (ssr:false) since Quill
 * touches `document`. Because next/dynamic doesn't forward refs, the Quill instance is reached through a
 * `registerInsert` callback that hands the parent a "paste this HTML at the cursor" function (used for
 * inserting phrases). Selecting a full document template instead replaces the whole `value` from the parent.
 */
export const DocumentEditor: FC<{
  value: TextEditorValue;
  onChange: (value: TextEditorValue) => void;
  /** Optional — given a "paste this HTML at the cursor" function (used to insert phrases). */
  registerInsert?: (insert: (html: string) => void) => void;
}> = ({ value, onChange, registerInsert }) => {
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    // Read quillRef lazily inside the closure — the instance is set by the time a phrase is inserted.
    registerInsert?.((html) => {
      const quill = quillRef.current;
      if (!quill) {
        return;
      }
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      // Pasting with source 'user' fires Quill's text-change, so TextEditor's onChange syncs `value`.
      quill.clipboard.dangerouslyPasteHTML(index, html, 'user');
    });
  }, [registerInsert]);

  return (
    <TextEditor
      className="text-editor-with-toolbar w-full"
      ref={quillRef}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  );
};

export default DocumentEditor;
