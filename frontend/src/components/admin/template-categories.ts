/**
 * The four kinds of template the admin page manages. A template is placed by two metadata tags: `kind`
 * separates a full mall from an insertable frastext, and `code` ties it to a CM type — a journal entry
 * type or a document type. The two code catalogues do not overlap, which is what lets `target` be derived
 * from the code rather than stored as a third tag.
 */
type TemplateTarget = 'journal' | 'document';

/** DOCUMENT is a full mall (replaces the body), PHRASE a frastext (inserted at the cursor). */
type TemplateKind = 'DOCUMENT' | 'PHRASE';

export interface TemplateCategory {
  id: string;
  target: TemplateTarget;
  kind: TemplateKind;
}

/** Declared as a tuple so the page can open on the first category without a possibly-undefined lookup. */
export const TEMPLATE_CATEGORIES = [
  { id: 'journalDocument', target: 'journal', kind: 'DOCUMENT' },
  { id: 'journalPhrase', target: 'journal', kind: 'PHRASE' },
  { id: 'documentDocument', target: 'document', kind: 'DOCUMENT' },
  { id: 'documentPhrase', target: 'document', kind: 'PHRASE' },
] as const satisfies readonly TemplateCategory[];

/**
 * Whether a template belongs to a category. The code has to be one the target's catalogue still knows:
 * templates tagged with a retired type code, or with a `kind` this page does not manage (the beslut
 * appendix uses APPENDIX), are left alone rather than shown under a category they do not belong to.
 *
 * @param codes The type codes of the category's target catalogue
 */
export const belongsToCategory = (
  template: { code: string; kind: string },
  category: TemplateCategory,
  codes: string[]
): boolean => template.kind === category.kind && codes.includes(template.code);
