import { TemplateSummary } from '@services/templating.service';
import { CATEGORY_KEY, isAppTemplate, KIND_KEY, metadataValue } from '@utils/template-metadata';

/** The kind a beslutsformulering carries in Templating. */
export const DECISION_PHRASE_KIND = 'DECISION_PHRASE';

/** The code a beslutsformulering carries: it belongs to the beslut, not to a CM type. */
export const DECISION_PHRASE_CODE = 'DECISION';

/** A beslutsformulering as the Beslut tab picks it: kategori and rubrik, its text fetched when added. */
export interface DecisionPhraseSummary {
  identifier: string;
  category: string;
  name: string;
}

/** Whether a template is one of this app's beslutsformuleringar. */
export const isDecisionPhrase = (template: TemplateSummary): boolean =>
  isAppTemplate(template) && metadataValue(template, KIND_KEY) === DECISION_PHRASE_KIND;

export const toDecisionPhraseSummary = (template: TemplateSummary): DecisionPhraseSummary => ({
  identifier: template.identifier ?? '',
  category: metadataValue(template, CATEGORY_KEY) ?? '',
  name: template.name ?? '',
});

const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Plain text as the rich-text editor's HTML: each line a paragraph, an empty line an empty paragraph. */
export const textToMarkup = (text: string): string =>
  text
    .split('\n')
    .map(line => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
    .join('');
