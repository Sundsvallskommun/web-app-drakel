import { describe, expect, it } from 'vitest';

import { fillBeslutPhraseMarkup, markupToPlainText, withPhraseAppended } from './beslut-phrase-markup';

describe('fillBeslutPhraseMarkup', () => {
  it('fills the placeholders in a phrase’s HTML, keeping a name as text', () => {
    expect(
      fillBeslutPhraseMarkup('<p>¤ beviljas ¥ kronor för ※.</p>', {
        applicantName: 'Ann <Test>',
        amount: 3000,
        periodFrom: '2026-09-01',
        periodTo: '2026-09-30',
      })
    ).toMatch(/^<p>Ann &lt;Test&gt; beviljas 3\s000 kronor för september 2026\.<\/p>$/);
  });
});

describe('withPhraseAppended', () => {
  it('replaces an editor that only looks empty, and adds after an empty row otherwise', () => {
    expect(withPhraseAppended({ markup: '<p><br></p>' }, '<p>Ny</p>')).toEqual({
      markup: '<p>Ny</p>',
      plainText: 'Ny',
    });
    expect(withPhraseAppended({ markup: '<p>Gammal</p>', plainText: 'Gammal' }, '<p>Ny</p>')).toEqual({
      markup: '<p>Gammal</p><p><br></p><p>Ny</p>',
      plainText: 'Gammal\n\nNy',
    });
  });
});

describe('markupToPlainText', () => {
  it('reads paragraphs as lines', () => {
    expect(markupToPlainText('<p>Ett &amp; två</p><p><br></p><p>tre</p>')).toBe('Ett & två\n\ntre');
  });
});
