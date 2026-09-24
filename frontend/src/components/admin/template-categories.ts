/**
 * The kinds of template the admin page manages. A template is placed by two metadata tags: `kind`
 * separates a full mall from an insertable frastext or a beslutsformulering, and `code` ties it to a CM
 * type — a journal entry type or a document type. The two code catalogues do not overlap, which is what
 * lets `target` be derived from the code rather than stored as a third tag. A beslutsformulering belongs
 * to the beslut rather than a CM type, so it carries the fixed code DECISION and its own kategori.
 */
type TemplateTarget = 'journal' | 'document' | 'decision';

/**
 * DOCUMENT is a full mall (replaces the body), PHRASE a frastext (inserted at the cursor), DECISION_PHRASE a
 * beslutsformulering (picked by kategori and rubrik in the Beslut tab).
 */
type TemplateKind = 'DOCUMENT' | 'PHRASE' | 'DECISION_PHRASE';

/** The code every beslutsformulering carries. */
export const DECISION_PHRASE_CODE = 'DECISION';

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
  { id: 'decisionPhrase', target: 'decision', kind: 'DECISION_PHRASE' },
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
