import { TextEditorValue } from '@sk-web-gui/text-editor';
import { escapeHtml } from '@utils/escape-html';
import { htmlToPlainText } from '@utils/sanitize-html';

import { BeslutPhraseValues, fillBeslutPhrase } from './fill-beslut-phrase';

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
  const phraseText = htmlToPlainText(phraseMarkup, { keepParagraphs: true });
  if (
    (message.plainText ?? '').trim().length === 0 &&
    htmlToPlainText(message.markup ?? '', { keepParagraphs: true }).trim().length === 0
  ) {
    return { markup: phraseMarkup, plainText: phraseText };
  }
  return {
    markup: `${message.markup ?? ''}<p><br></p>${phraseMarkup}`,
    plainText: `${message.plainText ?? ''}\n\n${phraseText}`,
  };
};
