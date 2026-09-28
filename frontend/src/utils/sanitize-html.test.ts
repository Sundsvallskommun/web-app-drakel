import { describe, expect, it } from 'vitest';

import { htmlToPlainText, sanitizeHtml, toEditorMarkup } from './sanitize-html';

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

  it('keeps one line per paragraph when asked to, as the editor does', () => {
    expect(
      htmlToPlainText('<p>Ett &amp; två</p><p><br></p><p class="ql-align-center">tre</p>', { keepParagraphs: true })
    ).toBe('Ett & två\n\ntre');
  });

  it('decodes quotes and apostrophes', () => {
    expect(htmlToPlainText('<p>&quot;O&#39;Brien&quot;</p>', { keepParagraphs: true })).toBe('"O\'Brien"');
  });
});

describe('sanitizeHtml', () => {
  it('forces rel="noopener noreferrer" on links, also those opening a new tab', () => {
    expect(sanitizeHtml('<a href="https://sundsvall.se" target="_blank" rel="opener">Länk</a>')).toBe(
      '<a href="https://sundsvall.se" target="_blank" rel="noopener noreferrer">Länk</a>'
    );
  });

  it('drops script and event handlers but keeps the formatting the editor needs', () => {
    expect(
      sanitizeHtml(
        '<h2>Rubrik</h2><p class="ql-align-center other">A <strong>b</strong> <em>c</em> <u>d</u></p>' +
          '<ol><li data-list="bullet">Punkt</li></ol><img src="x" onerror="alert(1)"><script>alert(2)</script>'
      )
    ).toBe(
      '<h2>Rubrik</h2><p class="ql-align-center">A <strong>b</strong> <em>c</em> <u>d</u></p>' +
        '<ol><li data-list="bullet">Punkt</li></ol>'
    );
  });
});

describe('toEditorMarkup', () => {
  it('sanitizes stored HTML before it reaches the editor', () => {
    expect(toEditorMarkup('<p>Hej</p><img src="x" onerror="alert(1)">')).toBe('<p>Hej</p>');
  });

  it('turns plain text into escaped paragraphs', () => {
    expect(toEditorMarkup('Rad <1>\n\nRad 2')).toBe('<p>Rad &lt;1&gt;</p><p><br></p><p>Rad 2</p>');
  });
});
