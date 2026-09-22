import { buildTemplateIdentifier } from '@utils/template-identifier';
import { describe, expect, it } from 'vitest';

describe('buildTemplateIdentifier', () => {
  it('only uses characters the Templating service accepts in an identifier', () => {
    const identifier = buildTemplateIdentifier('SERVICE_NOTE', 'PHRASE', 'Begärt komplettering (brev)');
    expect(identifier).toMatch(/^[a-z0-9.-]+$/);
  });

  it('places the template under its type and kind', () => {
    const identifier = buildTemplateIdentifier('SERVICE_NOTE', 'DOCUMENT', 'Tjänsteanteckning');
    expect(identifier).toContain('drakel.fa.service-note.document.');
  });

  it('keeps the Swedish vowels apart rather than dropping them', () => {
    // "Övrigt" and "Ovrigt" are different templates; stripping the diaeresis would merge their names.
    const overSkott = buildTemplateIdentifier('LETTER', 'DOCUMENT', 'Överskott');
    expect(overSkott).toContain('.overskott.');
  });

  it('gives two templates with the same name distinct identifiers', () => {
    // Storing an existing identifier adds a version to that template, so a collision would silently
    // overwrite an unrelated mall instead of creating a second one.
    const first = buildTemplateIdentifier('LETTER', 'PHRASE', 'Hälsning');
    const second = buildTemplateIdentifier('LETTER', 'PHRASE', 'Hälsning');
    expect(first).not.toBe(second);
  });

  it('falls back to a usable segment when the name has nothing to slugify', () => {
    expect(buildTemplateIdentifier('LETTER', 'PHRASE', '???')).toContain('.mall.');
  });
});
