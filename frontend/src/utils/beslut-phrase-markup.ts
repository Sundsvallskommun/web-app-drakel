import { TextEditorValue } from '@sk-web-gui/text-editor';
import { escapeHtml } from '@utils/escape-html';

import { BeslutPhraseValues, fillBeslutPhrase } from './fill-beslut-phrase';

/** The text of an editor's HTML, paragraph by paragraph — what the message's plain text is kept as. */
export const markupToPlainText = (markup: string): string =>
  markup
    .replace(/<\/p>\s*<p>/g, '\n')
    .replace(/<br\s*\/?>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/**
 * Fills a beslutsformulering's HTML from the errand, as fillBeslutPhrase does for text. The sökandes name is
 * escaped first, so a name is always text in the message, never markup.
 */
export const fillBeslutPhraseMarkup = (markup: string, values: BeslutPhraseValues): string =>
  fillBeslutPhrase(markup, {
    ...values,
    applicantName: values.applicantName === undefined ? undefined : escapeHtml(values.applicantName),
  });

/**
 * The message with a phrase added at the bottom, one empty line after what is there. An editor that only
 * looks empty (Quill keeps `<p></p>` once touched) is replaced rather than appended to.
 */
export const withPhraseAppended = (message: TextEditorValue, phraseMarkup: string): TextEditorValue => {
  const phraseText = markupToPlainText(phraseMarkup);
  if ((message.plainText ?? '').trim().length === 0 && markupToPlainText(message.markup ?? '').trim().length === 0) {
    return { markup: phraseMarkup, plainText: phraseText };
  }
  return {
    markup: `${message.markup ?? ''}<p><br></p>${phraseMarkup}`,
    plainText: `${message.plainText ?? ''}\n\n${phraseText}`,
  };
};
