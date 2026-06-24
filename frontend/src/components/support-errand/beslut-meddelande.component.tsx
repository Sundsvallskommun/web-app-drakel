'use client';

import TextEditor from '@components/common/text-editor.component';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { Combobox, FormControl, FormLabel } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { FC, useMemo, useState } from 'react';

import {
  AMOUNT_PLACEHOLDER,
  BESLUT_PHRASE_GROUPS,
  BeslutPhrase,
  NAME_PLACEHOLDER,
  PERIOD_PLACEHOLDER,
} from './beslut-phrases';

const EMPTY_VALUE: TextEditorValue = { markup: '', plainText: '' };

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Each line of the phrase becomes a Quill paragraph; an empty line renders as <p><br></p>. */
const toMarkup = (text: string): string =>
  text
    .split('\n')
    .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
    .join('');

/**
 * Decision-message editor: a WYSIWYG TextEditor plus a two-level phrase picker — a kategori dropdown and a
 * searchable rubrik combobox. Selecting a rubrik appends its text to the bottom of the editor, separated
 * from the previous content by two empty rows, with the `¤` placeholder replaced by the sökande's name.
 * `§` (belopp) and `※` (period) are left in place — they will be mapped from the beräkning later.
 */
export const BeslutMeddelande: FC<{ errandId: string }> = ({ errandId }) => {
  const { stakeholders } = useErrandStakeholders(errandId);
  const applicant = stakeholders.find((stakeholder) => stakeholder.role === 'APPLICANT');
  const applicantName = applicant ? stakeholderDisplayName(applicant) : '';

  const [categoryId, setCategoryId] = useState<string>(BESLUT_PHRASE_GROUPS[0]?.id ?? '');
  // The rubrik combobox keeps its own selection; each newly-selected rubrik is appended to the editor.
  const [selectedHeadingIds, setSelectedHeadingIds] = useState<string[]>([]);
  const [value, setValue] = useState<TextEditorValue>(EMPTY_VALUE);

  const activeGroup = BESLUT_PHRASE_GROUPS.find((group) => group.id === categoryId);
  const headings = activeGroup?.phrases ?? [];
  // The kategori combobox is single-select; a stable array keeps the controlled value from churning.
  const categoryValue = useMemo(() => (categoryId ? [categoryId] : []), [categoryId]);

  const addPhrase = (phrase: BeslutPhrase): void => {
    // Only the name is substituted now; the belopp/period markers are filled from the beräkning later.
    const filledText = applicantName ? phrase.text.split(NAME_PLACEHOLDER).join(applicantName) : phrase.text;
    const hasContent = (value.plainText ?? '').trim().length > 0;
    // Two empty rows between the previous content and the inserted phrase.
    const separatorMarkup = hasContent ? '<p><br></p><p><br></p>' : '';
    const separatorText = hasContent ? '\n\n\n' : '';
    setValue({
      markup: (value.markup ?? '') + separatorMarkup + toMarkup(filledText),
      plainText: (value.plainText ?? '') + separatorText + filledText,
    });
  };

  return (
    <div className="pt-24 flex flex-col gap-16 max-w-[64rem]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <FormControl id="beslut-fraskategori" className="w-full">
          <FormLabel>Frastext – kategori</FormLabel>
          <Combobox
            multiple
            value={categoryValue}
            placeholder="Välj kategori"
            searchPlaceholder="Sök kategori…"
            onSelect={(event) => {
              const selected = (event.target.value as unknown as string[]) ?? [];
              // Single-select: keep the newest pick (ignore deselecting the current one).
              const next = selected.find((id) => id !== categoryId) ?? selected[selected.length - 1] ?? categoryId;
              if (next !== categoryId) {
                setCategoryId(next);
                setSelectedHeadingIds([]);
              }
            }}
          >
            <Combobox.Input className="w-full" />
            <Combobox.List>
              {BESLUT_PHRASE_GROUPS.map((group) => (
                <Combobox.Option key={group.id} value={group.id}>
                  {group.name}
                </Combobox.Option>
              ))}
            </Combobox.List>
          </Combobox>
        </FormControl>

        <FormControl id="beslut-frasrubrik" className="w-full">
          <FormLabel>Frastext – rubrik</FormLabel>
          <Combobox
            multiple
            value={selectedHeadingIds}
            placeholder="Välj och lägg till frastext"
            searchPlaceholder="Sök rubrik…"
            onSelect={(event) => {
              const selected = (event.target.value as unknown as string[]) ?? [];
              const added = selected.filter((id) => !selectedHeadingIds.includes(id));
              added.forEach((id) => {
                const phrase = headings.find((candidate) => candidate.id === id);
                if (phrase) {
                  addPhrase(phrase);
                }
              });
              setSelectedHeadingIds(selected);
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
