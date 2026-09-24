import DecisionPhraseDefaultsService from '@services/decision-phrase-defaults.service';
import TemplatingService from '@services/templating.service';
import { DEFAULT_DECISION_PHRASES } from '@utils/default-decision-phrases';
import { afterEach, describe, expect, it, vi } from 'vitest';

const templateOf = (category: string, name: string) => ({
  identifier: `drakel.fa.decision.${name}`,
  name,
  metadata: [
    { key: 'app', value: 'drakel' },
    { key: 'code', value: 'DECISION' },
    { key: 'kind', value: 'DECISION_PHRASE' },
    { key: 'category', value: category },
  ],
});

describe('DecisionPhraseDefaultsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds every default beslutsformulering Templating lacks, as HTML with its kategori', async () => {
    vi.spyOn(TemplatingService.prototype, 'listTemplates').mockResolvedValue([]);
    const store = vi.spyOn(TemplatingService.prototype, 'storeTemplate').mockResolvedValue();

    expect(await new DecisionPhraseDefaultsService().addMissing()).toBe(DEFAULT_DECISION_PHRASES.length);

    const bifall = store.mock.calls.map(call => call[0]).find(input => input.name === 'Bifall månad');
    expect(bifall?.metadata).toEqual([
      { key: 'app', value: 'drakel' },
      { key: 'code', value: 'DECISION' },
      { key: 'kind', value: 'DECISION_PHRASE' },
      { key: 'category', value: 'Ek bistånd Bifall MÅNAD PERIOD ÄNDAMÅL' },
    ]);
    expect(bifall?.content).toMatch(/^<p>Ni har gjort vad ni kan.*<\/p><p>Ekonomiskt bistånd beviljas med ¥ kronor för ※, se beräkning\./);
  });

  it('never duplicates or overwrites a phrase that is already there', async () => {
    vi.spyOn(TemplatingService.prototype, 'listTemplates').mockResolvedValue(
      DEFAULT_DECISION_PHRASES.map(phrase => templateOf(phrase.category, phrase.name)),
    );
    const store = vi.spyOn(TemplatingService.prototype, 'storeTemplate');

    expect(await new DecisionPhraseDefaultsService().addMissing()).toBe(0);
    expect(store).not.toHaveBeenCalled();
  });
});
