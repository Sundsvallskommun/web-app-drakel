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
    allowedAttributes: { a: ['href', 'name', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  });

/** Strips all markup (for previews and quotes), keeping the text with block elements separated by spaces. */
export const htmlToPlainText = (html: string): string =>
  sanitize(html.replace(/<\/(p|div|h[1-6]|li)>|<br\s*\/?>/gi, ' '), { allowedTags: [], allowedAttributes: {} })
    // sanitize-html re-escapes the text; the result is rendered as React text, so decode the entities again.
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Heuristic: does this string contain HTML markup (so it should be rendered, not shown as plain text)? */
export const looksLikeHtml = (value: string): boolean => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Prepares stored text for the WYSIWYG editor: HTML is used as-is, older plain text is turned into
 * paragraphs so its line breaks survive. Shared by the document and journal edit modals.
 */
export const toEditorMarkup = (text: string): string =>
  !text ? ''
  : looksLikeHtml(text) ? text
  : text
      .split('\n')
      .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
      .join('');
