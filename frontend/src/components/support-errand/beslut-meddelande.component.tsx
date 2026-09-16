'use client';

import TextEditor from '@components/common/text-editor.component';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { Checkbox, Combobox, FormControl, FormLabel } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { FC, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ALL_CATEGORY_ID,
  ALL_PHRASES,
  AMOUNT_PLACEHOLDER,
  BESLUT_PHRASE_GROUPS,
  BeslutPhrase,
  NAME_PLACEHOLDER,
  PERIOD_PLACEHOLDER,
} from './beslut-phrases';

// A single-select combobox reports its value as a string; guard against the array shape just in case.
const eventValue = (value: unknown): string =>
  typeof value === 'string' ? value
  : Array.isArray(value) && typeof value[0] === 'string' ? value[0]
  : '';

const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Each line of the phrase becomes a Quill paragraph; an empty line renders as <p><br></p>. */
const toMarkup = (text: string): string =>
  text
    .split('\n')
    .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
    .join('');

/**
 * Decision-message editor: a WYSIWYG TextEditor plus a two-level phrase picker — a kategori combobox and a
 * searchable rubrik combobox (both single-select). Selecting a rubrik appends its text to the bottom of
 * the editor, separated from the previous content by two empty rows, with the `¤` placeholder replaced by
 * the sökande's name. `§`→`¥` (belopp) and `※` (period) are left in place — mapped from the beräkning later.
 */
export const BeslutMeddelande: FC<{
  errandId: string;
  /** The decision-message content, owned by the parent so the Beslut tab's Spara can read it. */
  value: TextEditorValue;
  onChange: (value: TextEditorValue) => void;
  /** Whether the fullföljdshänvisning is appended to the message when the decision is saved. */
  addFullfoljd: boolean;
  onAddFullfoljdChange: (checked: boolean) => void;
  /** Called when the user edits the message (typing or inserting a phrase) — not on programmatic load. */
  onUserEdit?: () => void;
}> = ({ errandId, value, onChange, addFullfoljd, onAddFullfoljdChange, onUserEdit }) => {
  const { t } = useTranslation('decision');
  const { stakeholders } = useErrandStakeholders(errandId);
  const applicant = stakeholders.find((stakeholder) => stakeholder.role === 'APPLICANT');
  const applicantName = applicant ? stakeholderDisplayName(applicant) : '';

  // "Alla" first, then the real categories. The category names belong to the Swedish phrase texts, so they
  // are shown as-is; only "Alla" is a UI word.
  const categoryOptions = [
    { id: ALL_CATEGORY_ID, name: t('message.allCategories') },
    ...BESLUT_PHRASE_GROUPS.map((group) => ({ id: group.id, name: group.name })),
  ];

  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORY_ID);
  // Bumped after every insert so the rubrik combobox remounts and clears — letting the same rubrik be
  // added again (a single-select combobox would otherwise stay on its current pick).
  const [insertNonce, setInsertNonce] = useState<number>(0);

  const headings =
    categoryId === ALL_CATEGORY_ID ? ALL_PHRASES : (
      (BESLUT_PHRASE_GROUPS.find((group) => group.id === categoryId)?.phrases ?? [])
    );

  const addPhrase = (phrase: BeslutPhrase): void => {
    // Only the name is substituted now; the belopp/period markers are filled from the beräkning later.
    const filledText = applicantName ? phrase.text.split(NAME_PLACEHOLDER).join(applicantName) : phrase.text;
    const phraseMarkup = toMarkup(filledText);
    // An "empty" editor still has markup like <p></p> once it's been touched — replace it (rather than
    // append) so the phrase doesn't end up after an empty first line. Otherwise add one empty line.
    if ((value.plainText ?? '').trim().length === 0) {
      onChange({ markup: phraseMarkup, plainText: filledText });
    } else {
      onChange({
        markup: (value.markup ?? '') + '<p><br></p>' + phraseMarkup,
        plainText: (value.plainText ?? '') + '\n\n' + filledText,
      });
    }
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
              value={categoryId}
              placeholder={t('message.categoryPlaceholder')}
              searchPlaceholder={t('message.categorySearch')}
              onSelect={(event) => {
                const next = eventValue(event.target.value);
                if (next && next !== categoryId) {
                  setCategoryId(next);
                }
              }}
            >
              <Combobox.Input className="w-full" />
              <Combobox.List>
                {categoryOptions.map((option) => (
                  <Combobox.Option key={option.id} value={option.id}>
                    {option.name}
                  </Combobox.Option>
                ))}
              </Combobox.List>
            </Combobox>
          </FormControl>

          <FormControl id="beslut-frasrubrik" className="w-full md:w-[36rem]">
            <FormLabel>{t('message.headingLabel')}</FormLabel>
            <Combobox
              key={`${categoryId}-${insertNonce}`}
              placeholder={t('message.headingPlaceholder')}
              searchPlaceholder={t('message.headingSearch')}
              onSelect={(event) => {
                const phrase = headings.find((candidate) => candidate.id === eventValue(event.target.value));
                if (phrase) {
                  addPhrase(phrase);
                }
              }}
            >
              <Combobox.Input className="w-full" />
              <Combobox.List>
                {headings.map((phrase) => (
                  <Combobox.Option key={phrase.id} value={phrase.id}>
                    {phrase.name}
                  </Combobox.Option>
                ))}
              </Combobox.List>
            </Combobox>
          </FormControl>
        </div>

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
