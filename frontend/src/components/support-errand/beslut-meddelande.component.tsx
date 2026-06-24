'use client';

import TextEditor from '@components/common/text-editor.component';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { Combobox, FormControl, FormLabel } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { FC, useState } from 'react';

import {
  ALL_CATEGORY_ID,
  ALL_PHRASES,
  AMOUNT_PLACEHOLDER,
  BESLUT_PHRASE_GROUPS,
  BeslutPhrase,
  NAME_PLACEHOLDER,
  PERIOD_PLACEHOLDER,
} from './beslut-phrases';

// "Alla" first, then the real categories.
const CATEGORY_OPTIONS = [
  { id: ALL_CATEGORY_ID, name: 'Alla' },
  ...BESLUT_PHRASE_GROUPS.map((group) => ({ id: group.id, name: group.name })),
];

const EMPTY_VALUE: TextEditorValue = { markup: '', plainText: '' };

// A single-select combobox reports its value as a string; guard against the array shape just in case.
const eventValue = (value: unknown): string =>
  typeof value === 'string' ? value
  : Array.isArray(value) && typeof value[0] === 'string' ? value[0]
  : '';

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
export const BeslutMeddelande: FC<{ errandId: string }> = ({ errandId }) => {
  const { stakeholders } = useErrandStakeholders(errandId);
  const applicant = stakeholders.find((stakeholder) => stakeholder.role === 'APPLICANT');
  const applicantName = applicant ? stakeholderDisplayName(applicant) : '';

  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORY_ID);
  // Bumped after every insert so the rubrik combobox remounts and clears — letting the same rubrik be
  // added again (a single-select combobox would otherwise stay on its current pick).
  const [insertNonce, setInsertNonce] = useState<number>(0);
  const [value, setValue] = useState<TextEditorValue>(EMPTY_VALUE);

  const headings =
    categoryId === ALL_CATEGORY_ID ? ALL_PHRASES : (BESLUT_PHRASE_GROUPS.find((group) => group.id === categoryId)?.phrases ?? []);

  const addPhrase = (phrase: BeslutPhrase): void => {
    // Only the name is substituted now; the belopp/period markers are filled from the beräkning later.
    const filledText = applicantName ? phrase.text.split(NAME_PLACEHOLDER).join(applicantName) : phrase.text;
    const phraseMarkup = toMarkup(filledText);
    // An "empty" editor still has markup like <p></p> once it's been touched — replace it (rather than
    // append) so the phrase doesn't end up after an empty first line. Otherwise add one empty line.
    if ((value.plainText ?? '').trim().length === 0) {
      setValue({ markup: phraseMarkup, plainText: filledText });
    } else {
      setValue({
        markup: (value.markup ?? '') + '<p><br></p>' + phraseMarkup,
        plainText: (value.plainText ?? '') + '\n\n' + filledText,
      });
    }
    setInsertNonce((nonce) => nonce + 1);
  };

  return (
    <div className="pt-24 flex flex-col gap-16 max-w-[64rem]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <FormControl id="beslut-fraskategori" className="w-full">
          <FormLabel>Frastext – kategori</FormLabel>
          <Combobox
            value={categoryId}
            placeholder="Välj kategori"
            searchPlaceholder="Sök kategori…"
            onSelect={(event) => {
              const next = eventValue(event.target.value);
              if (next && next !== categoryId) {
                setCategoryId(next);
              }
            }}
          >
            <Combobox.Input className="w-full" />
            <Combobox.List>
              {CATEGORY_OPTIONS.map((option) => (
                <Combobox.Option key={option.id} value={option.id}>
                  {option.name}
                </Combobox.Option>
              ))}
            </Combobox.List>
          </Combobox>
        </FormControl>

        <FormControl id="beslut-frasrubrik" className="w-full">
          <FormLabel>Frastext – rubrik</FormLabel>
          <Combobox
            key={`${categoryId}-${insertNonce}`}
            placeholder="Välj och lägg till frastext"
            searchPlaceholder="Sök rubrik…"
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
        <span className="font-bold">{NAME_PLACEHOLDER}</span> ersätts med sökandes namn.{' '}
        <span className="font-bold">{AMOUNT_PLACEHOLDER}</span> (belopp) och{' '}
        <span className="font-bold">{PERIOD_PLACEHOLDER}</span> (period) fylls i från beräkningen senare.
        {applicantName ? '' : ' Sökandes namn kunde inte hämtas — namn-platshållaren lämnas oersatt.'}
      </p>

      <FormControl id="beslut-meddelande" className="w-full">
        <FormLabel>Beslutsmeddelande</FormLabel>
        <TextEditor
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
        />
      </FormControl>
    </div>
  );
};
