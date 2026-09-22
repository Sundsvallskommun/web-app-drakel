import { describe, expect, it } from 'vitest';

import { belongsToCategory, TEMPLATE_CATEGORIES } from './template-categories';

const [journalTemplates, journalPhrases, documentTemplates] = TEMPLATE_CATEGORIES;

const JOURNAL_CODES = ['SERVICE_NOTE'];
const DOCUMENT_CODES = ['LETTER'];

describe('belongsToCategory', () => {
  it('places a template by both its kind and its type catalogue', () => {
    const template = { code: 'SERVICE_NOTE', kind: 'DOCUMENT' };
    expect(belongsToCategory(template, journalTemplates, JOURNAL_CODES)).toBe(true);
    expect(belongsToCategory(template, documentTemplates, DOCUMENT_CODES)).toBe(false);
  });

  it('keeps mallar and frastexter of the same type apart', () => {
    const phrase = { code: 'SERVICE_NOTE', kind: 'PHRASE' };
    expect(belongsToCategory(phrase, journalPhrases, JOURNAL_CODES)).toBe(true);
    expect(belongsToCategory(phrase, journalTemplates, JOURNAL_CODES)).toBe(false);
  });

  it('leaves a kind this page does not manage out of every category', () => {
    // The beslut fullföljdshänvisning is tagged APPENDIX; it is not a mall or a frastext.
    const appendix = { code: 'DECISION_NOTIFICATION', kind: 'APPENDIX' };
    const inAnyCategory = TEMPLATE_CATEGORIES.some((category) =>
      belongsToCategory(appendix, category, [...JOURNAL_CODES, ...DOCUMENT_CODES, 'DECISION_NOTIFICATION'])
    );
    expect(inAnyCategory).toBe(false);
  });

  it('leaves out a template tagged with a type code the catalogue no longer has', () => {
    const retired = { code: 'RETIRED_TYPE', kind: 'DOCUMENT' };
    expect(belongsToCategory(retired, journalTemplates, JOURNAL_CODES)).toBe(false);
  });
});
