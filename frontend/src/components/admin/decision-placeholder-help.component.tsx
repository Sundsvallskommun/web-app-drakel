'use client';

import { Button } from '@sk-web-gui/react';
import { AMOUNT_PLACEHOLDER, NAME_PLACEHOLDER, PERIOD_PLACEHOLDER } from '@utils/fill-beslut-phrase';
import { Check, Copy } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** The characters a beslutsformulering may carry, each with what the beslut fills it with. */
const PLACEHOLDERS = [
  { character: NAME_PLACEHOLDER, meaning: 'name' },
  { character: AMOUNT_PLACEHOLDER, meaning: 'amount' },
  { character: PERIOD_PLACEHOLDER, meaning: 'period' },
] as const;

/** How long a copied character shows as copied. */
const COPIED_FOR_MS = 2000;

/**
 * The characters that are replaced automatically when a beslutsformulering is added to a beslut — the sökandes
 * name, the belopp and the period — each with a button that copies it, for the admin to paste into the text.
 */
export const DecisionPlaceholderHelp: FC = () => {
  const { t } = useTranslation('admin');
  const [copied, setCopied] = useState<string>();
  const [copyFailed, setCopyFailed] = useState<boolean>(false);

  const copy = (character: string): void => {
    navigator.clipboard.writeText(character).then(
      () => {
        setCopyFailed(false);
        setCopied(character);
        window.setTimeout(() => {
          setCopied((current) => (current === character ? undefined : current));
        }, COPIED_FOR_MS);
      },
      () => {
        setCopyFailed(true);
      }
    );
  };

  return (
    <div className="flex flex-col gap-8 mb-8">
      <p className="m-0 text-small text-dark-secondary">{t('editor.placeholders.intro')}</p>
      <ul className="m-0 p-0 list-none flex flex-wrap gap-x-32 gap-y-8">
        {PLACEHOLDERS.map(({ character, meaning }) => (
          <li key={character} className="flex items-center gap-8 text-small">
            <span className="font-bold text-large w-24 text-center" aria-hidden>
              {character}
            </span>
            <span>{t(`editor.placeholders.${meaning}`)}</span>
            <Button
              size="sm"
              variant="tertiary"
              leftIcon={copied === character ? <Check /> : <Copy />}
              aria-label={t('editor.placeholders.copyLabel', {
                character,
                meaning: t(`editor.placeholders.${meaning}`).toLowerCase(),
              })}
              onClick={() => {
                copy(character);
              }}
            >
              {copied === character ? t('editor.placeholders.copied') : t('editor.placeholders.copy')}
            </Button>
          </li>
        ))}
      </ul>
      <p className="sr-only" role="status">
        {copied ? t('editor.placeholders.copiedStatus', { character: copied }) : ''}
      </p>
      {copyFailed ?
        <p className="m-0 text-small text-error-surface-primary">{t('editor.placeholders.copyFailed')}</p>
      : null}
    </div>
  );
};
