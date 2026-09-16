'use client';

import TextEditor, { TextEditorValue } from '@sk-web-gui/text-editor';
import type Quill from 'quill';
import { FC, useEffect, useRef } from 'react';

const ATTACH_LABEL = 'Bifoga fil';

// The toolbar from the design: headings and inline styles, lists, then image (used to attach files) and link.
const MESSAGE_TOOLBAR = [
  [{ header: 1 as const }, { header: 2 as const }, 'bold' as const, 'italic' as const, 'underline' as const],
  [{ list: 'bullet' as const }, { list: 'ordered' as const }],
  ['image' as const, 'link' as const],
];

/**
 * The rich-text body of the message composer. Imported via next/dynamic (ssr:false) since Quill touches
 * `document`. The toolbar's image button attaches files to the message (via `onAttachClick`) instead of
 * embedding images in the body, which would blow the message size limit and be stripped when rendered.
 */
const MessageEditor: FC<{
  value: TextEditorValue;
  onChange: (value: TextEditorValue) => void;
  placeholder: string;
  readOnly?: boolean;
  onAttachClick: () => void;
  /** Moves focus into the editor whenever this value changes (e.g. the id of the message being replied to). */
  focusKey?: string;
}> = ({ value, onChange, placeholder, readOnly, onAttachClick, focusKey }) => {
  const quillRef = useRef<Quill | null>(null);
  const onAttachClickRef = useRef(onAttachClick);

  useEffect(() => {
    onAttachClickRef.current = onAttachClick;
  }, [onAttachClick]);

  // The child TextEditor creates Quill in its own effect, which runs before this one.
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }
    const toolbar = quill.getModule('toolbar') as { addHandler: (format: string, handler: () => void) => void };
    toolbar.addHandler('image', () => {
      onAttachClickRef.current();
    });
    quill.root.setAttribute('aria-label', 'Nytt meddelande');

    // TextEditor labels the image button "Infoga bild" (aria-label + tooltip) on every render; since the button
    // attaches files here, keep relabelling it whenever that happens.
    const imageButton = quill.container.parentElement?.querySelector('.ql-image');
    if (!imageButton) {
      return;
    }
    const relabel = () => {
      if (imageButton.getAttribute('aria-label') !== ATTACH_LABEL) {
        imageButton.setAttribute('aria-label', ATTACH_LABEL);
      }
      const tooltip = imageButton.querySelector('.tooltip-container');
      if (tooltip && tooltip.textContent !== ATTACH_LABEL && tooltip.textContent) {
        tooltip.querySelectorAll('*').forEach((element) => {
          if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
            element.textContent = ATTACH_LABEL;
          }
        });
      }
    };
    relabel();
    const observer = new MutationObserver(relabel);
    observer.observe(imageButton, {
      attributes: true,
      attributeFilter: ['aria-label'],
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    quillRef.current?.root.setAttribute('data-placeholder', placeholder);
  }, [placeholder]);

  useEffect(() => {
    if (focusKey) {
      quillRef.current?.focus();
    }
  }, [focusKey]);

  return (
    <TextEditor
      className="message-editor w-full"
      ref={quillRef}
      toolbar={MESSAGE_TOOLBAR}
      readOnly={readOnly}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  );
};

export default MessageEditor;
