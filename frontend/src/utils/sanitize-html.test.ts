import { describe, expect, it } from 'vitest';

import { htmlToPlainText } from './sanitize-html';

describe('htmlToPlainText', () => {
  it('strips markup and separates block elements with spaces', () => {
    expect(htmlToPlainText('<h1>Rubrik</h1><p>Hej <strong>där</strong></p><ul><li>Ett</li><li>Två</li></ul>')).toBe(
      'Rubrik Hej där Ett Två'
    );
  });

  it('keeps special characters readable', () => {
    expect(htmlToPlainText('<p>A &amp; B &lt; C</p>')).toBe('A & B < C');
  });

  it('leaves plain text unchanged', () => {
    expect(htmlToPlainText('Bara text')).toBe('Bara text');
  });
});
