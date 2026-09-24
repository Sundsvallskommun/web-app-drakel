'use client';

import TextEditor from '@components/common/text-editor.component';
import { DecisionPhrase } from '@data-contracts/backend/data-contracts';
import { getDocumentTemplateContent } from '@services/document-template-service';
import { Checkbox, Combobox, FormControl, FormLabel } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { fillBeslutPhraseMarkup, withPhraseAppended } from '@utils/beslut-phrase-markup';
import { AMOUNT_PLACEHOLDER, NAME_PLACEHOLDER, PERIOD_PLACEHOLDER } from '@utils/fill-beslut-phrase';
import { FC, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

// The synthetic "Alla" category (first option) shows every rubrik regardless of kategori.
const ALL_CATEGORIES = '';

// A single-select combobox reports its value as a string; guard against the array shape just in case.
const eventValue = (value: unknown): string =>
  typeof value === 'string' ? value
  : Array.isArray(value) && typeof value[0] === 'string' ? value[0]
  : '';

/**
 * Decision-message editor: a WYSIWYG TextEditor plus a two-level phrase picker — a kategori combobox and a
 * searchable rubrik combobox (both single-select). The beslutsformuleringar are Templating's, kept on the admin
 * page. Selecting a rubrik appends its text to the bottom of the editor, separated from the previous content by
 * an empty row, filled from the errand: `¤` with the sökandes name, `¥` with the belopp and `※` with the period
 * as the form holds them when the phrase is added. A value the errand lacks leaves its placeholder.
 */
export const BeslutMeddelande: FC<{
  /** The beslutsformuleringar to pick from. */
  phrases: DecisionPhrase[];
  /** The sökandes name, filled in for `¤`; empty when it could not be read. */
  applicantName: string;
  /** The decision-message content, owned by the parent so the Beslut tab's Spara can read it. */
  value: TextEditorValue;
  onChange: (value: TextEditorValue) => void;
  /** Whether the fullföljdshänvisning is appended to the message when the decision is saved. */
  addFullfoljd: boolean;
  onAddFullfoljdChange: (checked: boolean) => void;
  /** Called when the user edits the message (typing or inserting a phrase) — not on programmatic load. */
  onUserEdit?: () => void;
  /** The beslut's belopp, filled in for `¥`. */
  amount?: number;
  /** The beslut's period (`YYYY-MM-DD`), filled in for `※`. */
  periodFrom?: string;
  periodTo?: string;
}> = ({
  phrases,
  applicantName,
  value,
  onChange,
  addFullfoljd,
  onAddFullfoljdChange,
  onUserEdit,
  amount,
  periodFrom,
  periodTo,
}) => {
  const { t } = useTranslation('decision');
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [phraseError, setPhraseError] = useState<string>();
  // Bumped after every insert so the rubrik combobox remounts and clears — letting the same rubrik be
  // added again (a single-select combobox would otherwise stay on its current pick).
  const [insertNonce, setInsertNonce] = useState<number>(0);

  // The kategorier as the phrases name them, in the order they first appear. They belong to the Swedish
  // phrase texts, so they are shown as-is; only "Alla" is a UI word.
  const categories = [...new Set(phrases.map((phrase) => phrase.category))];
  const headings = category === ALL_CATEGORIES ? phrases : phrases.filter((phrase) => phrase.category === category);

  const addPhrase = async (phrase: DecisionPhrase): Promise<void> => {
    setPhraseError(undefined);
    const content = await getDocumentTemplateContent(phrase.identifier);
    if (content.error || content.data === undefined) {
      setPhraseError(t('message.phraseLoadError'));
      return;
    }
    const filled = fillBeslutPhraseMarkup(content.data, { applicantName, amount, periodFrom, periodTo });
    onChange(withPhraseAppended(value, filled));
    onUserEdit?.();
    setInsertNonce((nonce) => nonce + 1);
  };

  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-col gap-12">
        <div className="flex flex-wrap gap-x-24 gap-y-16">
          <FormControl id="beslut-fraskategori" className="w-full md:w-[28rem]">
            <FormLabel>{t('message.categoryLabel')}</FormLabel>
            <Combobox
              value={category}
              placeholder={t('message.categoryPlaceholder')}
              searchPlaceholder={t('message.categorySearch')}
              onSelect={(event) => {
                setCategory(eventValue(event.target.value));
              }}
            >
              <Combobox.Input className="w-full" />
              <Combobox.List>
                <Combobox.Option value={ALL_CATEGORIES}>{t('message.allCategories')}</Combobox.Option>
                {categories.map((name) => (
                  <Combobox.Option key={name} value={name}>
                    {name}
                  </Combobox.Option>
                ))}
              </Combobox.List>
            </Combobox>
          </FormControl>

          <FormControl id="beslut-frasrubrik" className="w-full md:w-[36rem]">
            <FormLabel>{t('message.headingLabel')}</FormLabel>
            <Combobox
              key={`${category}-${String(insertNonce)}`}
              placeholder={t('message.headingPlaceholder')}
              searchPlaceholder={t('message.headingSearch')}
              onSelect={(event) => {
                const phrase = headings.find((candidate) => candidate.identifier === eventValue(event.target.value));
                if (phrase) {
                  void addPhrase(phrase);
                }
              }}
            >
              <Combobox.Input className="w-full" />
              <Combobox.List>
                {headings.map((phrase) => (
                  <Combobox.Option key={phrase.identifier} value={phrase.identifier}>
                    {phrase.name}
                  </Combobox.Option>
                ))}
              </Combobox.List>
            </Combobox>
          </FormControl>
        </div>

        {phraseError ?
          <p className="m-0 text-error-surface-primary">{phraseError}</p>
        : null}
        <p className="m-0 text-small text-dark-secondary">
          <Trans
            t={t}
            i18nKey="message.placeholderHelp"
            values={{ name: NAME_PLACEHOLDER, amount: AMOUNT_PLACEHOLDER, period: PERIOD_PLACEHOLDER }}
            components={{ bold: <span className="font-bold" /> }}
          />
          {applicantName ? '' : ` ${t('message.applicantNameMissing')}`}
        </p>
      </div>

      <FormControl id="beslut-meddelande" className="w-full">
        {/* The surrounding box is already titled "Beslutsmeddelande", so the label is for screen readers only. */}
        <FormLabel className="sr-only">{t('message.title')}</FormLabel>
        <TextEditor
          className="text-editor-with-toolbar w-full"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onTextChange={(_delta, _oldDelta, source) => {
            // Only a 'user' edit marks the message dirty; programmatic loads/inserts use the 'api' source.
            if (source === 'user') {
              onUserEdit?.();
            }
          }}
        />
      </FormControl>

      {/* The fullföljdshänvisning is appended to the end of the message on save, hence placed under the editor. */}
      <Checkbox
        checked={addFullfoljd}
        onChange={(event) => {
          onAddFullfoljdChange(event.target.checked);
        }}
      >
        {t('message.addFullfoljd')}
      </Checkbox>
    </div>
  );
};
