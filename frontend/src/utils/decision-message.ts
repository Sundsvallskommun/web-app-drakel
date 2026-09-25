import { TextEditorValue } from '@sk-web-gui/text-editor';
import { formatApplicationMonth } from '@utils/application-month';
import { escapeHtml } from '@utils/escape-html';

/** The förvaltning and enhet the message is signed from, set in bold under the handläggare's name. */
const SENDER_LINES = ['Individ- och Arbetsmarknadsförvaltningen', 'Enheten för ekonomiskt bistånd'];

/** An empty line in the editor, as Quill writes it. */
const EMPTY_LINE = '<p><br></p>';

const paragraph = (text: string): string => `<p>${escapeHtml(text)}</p>`;
const boldParagraph = (text: string): string => `<p><strong>${escapeHtml(text)}</strong></p>`;

/**
 * The message proposed when the beräkning and the beslut are sent to the sökande — the handläggare edits it before
 * sending. The ansökan's month (`YYYY-MM`) is written out, "september 2026"; without one the sentence leaves it out.
 * Signed with the handläggare's name, then the förvaltning and enhet in bold.
 */
export const buildDecisionMessage = (applicationMonth: string | undefined, caseworkerName: string): TextEditorValue => {
  const month = applicationMonth ? formatApplicationMonth(applicationMonth).toLowerCase() : undefined;
  const readySentence =
    month ? `Din ansökan för ${month} är klar. Se bifogade dokument.` : 'Din ansökan är klar. Se bifogade dokument.';
  return {
    markup: [
      paragraph('Hej,'),
      EMPTY_LINE,
      paragraph(readySentence),
      EMPTY_LINE,
      paragraph(caseworkerName),
      ...SENDER_LINES.map(boldParagraph),
    ].join(''),
    plainText: ['Hej,', '', readySentence, '', caseworkerName, ...SENDER_LINES].join('\n'),
  };
};
