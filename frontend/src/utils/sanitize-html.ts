import { escapeHtml } from '@utils/escape-html';
import sanitize from 'sanitize-html';

// The tags the WYSIWYG editor (and our document templates) produce. Everything else is stripped.
const ALLOWED_TAGS = [
  'p',
  'br',
  'div',
  'span',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'del',
  'sub',
  'sup',
  'blockquote',
  'ol',
  'ul',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
];

/** Sanitizes editor/template HTML for safe rendering via dangerouslySetInnerHTML (works on server + client). */
export const sanitizeHtml = (unsafe: string): string =>
  sanitize(unsafe, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      // Quill writes both kinds of list as <ol> and tells them apart by data-list; without it a bullet
      // list would come back numbered.
      li: ['data-list'],
    },
    // Quill's alignment and indentation are classes (ql-align-center, ql-indent-1); nothing else is kept.
    allowedClasses: { '*': ['ql-*'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // A link that opens a new tab must not hand that tab a reference back to this one (window.opener).
    transformTags: { a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer' }) },
  });

interface PlainTextOptions {
  /**
   * Keep one line per paragraph, as the editor's own plain text does (an empty `<p><br></p>` is an empty line).
   * Otherwise the text comes back as one line, with block elements separated by spaces.
   */
  keepParagraphs?: boolean;
}

/** Strips every tag, keeping only the text (still HTML-escaped by sanitize-html). */
const stripTags = (html: string): string => sanitize(html, { allowedTags: [], allowedAttributes: {} });

/** sanitize-html re-escapes the text; the result is used as text (not markup), so decode the entities again. */
const decodeEntities = (text: string): string =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

/** Strips all markup (for previews, quotes and the editor's plain text), keeping only the text. */
export const htmlToPlainText = (html: string, { keepParagraphs = false }: PlainTextOptions = {}): string =>
  keepParagraphs ?
    decodeEntities(stripTags(html.replace(/<\/p>\s*<p[^>]*>/gi, '\n').replace(/<br\s*\/?>/gi, '')))
  : decodeEntities(stripTags(html.replace(/<\/(p|div|h[1-6]|li)>|<br\s*\/?>/gi, ' ')))
      .replace(/\s+/g, ' ')
      .trim();

/** Heuristic: does this string contain HTML markup (so it should be rendered, not shown as plain text)? */
export const looksLikeHtml = (value: string): boolean => /<\/?[a-z][\s\S]*>/i.test(value);

/**
 * Prepares stored text for the WYSIWYG editor: HTML is sanitized first — the editor puts it into the page, and
 * what Lifecare or Templating hand us is not ours — and older plain text is turned into paragraphs so its line
 * breaks survive. Shared by the document and journal edit modals and the template editor.
 */
export const toEditorMarkup = (text: string): string =>
  !text ? ''
  : looksLikeHtml(text) ? sanitizeHtml(text)
  : text
      .split('\n')
      .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
      .join('');
