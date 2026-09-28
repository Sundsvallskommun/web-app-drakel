const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text for use inside HTML markup — as element text or as a quoted attribute value — so a name or phrase
 * can never become a tag or break out of an attribute.
 */
export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character] ?? character);
