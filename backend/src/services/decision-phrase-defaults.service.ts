import TemplatingService from '@services/templating.service';
import { DECISION_PHRASE_CODE, DECISION_PHRASE_KIND, isDecisionPhrase, textToMarkup, toDecisionPhraseSummary } from '@utils/decision-phrase';
import { DEFAULT_DECISION_PHRASES } from '@utils/default-decision-phrases';
import { buildTemplateIdentifier } from '@utils/template-identifier';
import { appTemplateMetadata } from '@utils/template-metadata';

const sameText = (first: string, second: string): boolean => first.trim().toLowerCase() === second.trim().toLowerCase();

/**
 * Puts the beslutsformuleringar the Beslut tab used to carry in its own code into Templating, where the admin
 * page edits them. Only the ones Templating lacks — by kategori and rubrik — are added, so running it again
 * never duplicates a phrase or overwrites one that has been edited.
 */
class DecisionPhraseDefaultsService {
  private templatingService = new TemplatingService();

  /** Adds the missing default phrases; answers with how many were added. */
  async addMissing(): Promise<number> {
    const existing = (await this.templatingService.listTemplates()).filter(isDecisionPhrase).map(toDecisionPhraseSummary);
    const missing = DEFAULT_DECISION_PHRASES.filter(
      phrase => !existing.some(present => sameText(present.category, phrase.category) && sameText(present.name, phrase.name)),
    );
    // One at a time: Templating is a shared service, and a handful of phrases is no reason to load it.
    for (const phrase of missing) {
      await this.templatingService.storeTemplate({
        identifier: buildTemplateIdentifier(DECISION_PHRASE_CODE, DECISION_PHRASE_KIND, phrase.name),
        name: phrase.name,
        content: textToMarkup(phrase.text),
        metadata: appTemplateMetadata(DECISION_PHRASE_CODE, DECISION_PHRASE_KIND, phrase.category),
      });
    }
    return missing.length;
  }
}

export default DecisionPhraseDefaultsService;
