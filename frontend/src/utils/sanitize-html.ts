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

/** Heuristic: does this string contain HTML markup (so it should be rendered, not shown as plain text)? */
export const looksLikeHtml = (value: string): boolean => /<\/?[a-z][\s\S]*>/i.test(value);
