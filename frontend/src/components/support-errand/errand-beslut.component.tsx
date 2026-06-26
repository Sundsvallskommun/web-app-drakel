'use client';

import { PdfPreviewButton } from '@components/common/pdf-preview-button.component';
import { useErrandBeslut } from '@hooks/use-errand-beslut';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { createBeslut } from '@services/beslut-service';
import { getDocumentTemplateContent } from '@services/document-template-service';
import { Divider, FormControl, FormLabel, Input, Select, Spinner } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { resolveBeslutAmount, resolveBeslutPeriod } from '@utils/beslut';
import { formatAmount } from '@utils/format-amount';
import dayjs from 'dayjs';
import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { BeslutMeddelande } from './beslut-meddelande.component';
import { LockedBanner, LockFieldset } from './lockable-section.component';

const todayDate = (): string => dayjs().format('YYYY-MM-DD');

const EMPTY_MESSAGE: TextEditorValue = { markup: '', plainText: '' };

// The fullföljdshänvisning (appeal instructions) lives in the Templating service; it's appended to the
// beslutsmeddelande when the handläggare ticks the box.
const FULLFOLJD_TEMPLATE_IDENTIFIER = 'drakel.fa.beslut.fullfoljdshanvisning';

/**
 * "Beslut" tab — the Nytt beslut form (mirroring Lifecare's BESLUT / BESLUTSMEDDELANDE view). Datum,
 * Beslut and Från/Till are prefilled from the automated recommendation (falling back to today and the
 * normberäkning month); Belopp is 0 for an avslag, otherwise the recommended amount. Beslutsfattare and
 * Tjänst are intentionally omitted.
 */
export const ErrandBeslut: FC<{
  errandId: string;
  locked?: boolean;
  /** Rendered directly under the section heading (the "Markera som klart" approval control). */
  headerSlot?: ReactNode;
  /** Registers this tab's save with the parent so the central "Spara ärende" button runs it (null = nothing to save). */
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void;
}> = ({ errandId, locked = false, headerSlot, onRegisterSave }) => {
  const { draft, isLoading: draftLoading } = useErrandNormberakning(errandId);
  const { options, recommendation, savedBeslut, isLoading: beslutLoading, refresh } = useErrandBeslut(errandId);

  const period = useMemo(() => resolveBeslutPeriod(recommendation, draft), [recommendation, draft]);
  const today = useMemo(() => todayDate(), []);

  const [date, setDate] = useState<string>(todayDate);
  const [beslutCode, setBeslutCode] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(period.fromDate);
  const [toDate, setToDate] = useState<string>(period.toDate);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState<boolean>(false);
  // The beslutsmeddelande (composed below the divider) is saved as the decision's decisionMessage.
  const [messageValue, setMessageValue] = useState<TextEditorValue>(EMPTY_MESSAGE);
  const [addFullfoljd, setAddFullfoljd] = useState<boolean>(true);
  // Whether the user has edited the message since it was last loaded/saved. Tracked via a flag (not a
  // markup diff) because Quill re-normalizes loaded HTML, which would otherwise read as a change.
  const [messageTouched, setMessageTouched] = useState<boolean>(false);

  // The form is read back from the handläggare's saved beslut when there is one, otherwise from the
  // automated recommendation/period. This is also the baseline the dirty-check compares against.
  const prefillDate = savedBeslut?.decisionDate ?? recommendation?.decisionDate ?? today;
  const prefillBeslutCode = savedBeslut?.value ?? recommendation?.value ?? '';
  const prefillFrom = savedBeslut?.periodFrom ?? period.fromDate;
  const prefillTo = savedBeslut?.periodTo ?? period.toDate;
  const prefillMessage = savedBeslut?.decisionMessage ?? '';
  // A saved beslut's message already includes the fullföljdshänvisning (it was appended on save), so don't
  // default to appending it again; a fresh beslut defaults to adding it.
  const prefillAddFullfoljd = savedBeslut === null;

  // Prefill the form once the saved beslut / recommendation / period load (and again after a save reloads
  // them). User edits change the field state, not the prefill values, so they aren't clobbered.
  useEffect(() => {
    setDate(prefillDate);
    setBeslutCode(prefillBeslutCode);
  }, [prefillDate, prefillBeslutCode]);
  useEffect(() => {
    setFromDate(prefillFrom);
    setToDate(prefillTo);
  }, [prefillFrom, prefillTo]);
  useEffect(() => {
    setMessageValue(prefillMessage ? { markup: prefillMessage } : EMPTY_MESSAGE);
    setAddFullfoljd(prefillAddFullfoljd);
    // The freshly loaded message isn't a user edit.
    setMessageTouched(false);
  }, [prefillMessage, prefillAddFullfoljd]);

  const selectedOption = options.find((option) => option.code === beslutCode);
  const recommendedOption = options.find((option) => option.code === recommendation?.value);
  const amount = resolveBeslutAmount(selectedOption, savedBeslut?.amount ?? recommendation?.amount);

  const recommendationLabel =
    recommendedOption?.displayName ?? recommendation?.value ?? '— (ingen rekommendation från normberäkningen ännu)';

  // The beslut counts as dirty — and the central "Spara ärende" button lights up — only when a field
  // differs from the saved beslut (or, before any save, the prefilled recommendation) or the user has
  // edited the message. Opening the tab alone is not a change.
  const fieldsChanged =
    date !== prefillDate ||
    beslutCode !== prefillBeslutCode ||
    fromDate !== prefillFrom ||
    toDate !== prefillTo ||
    addFullfoljd !== prefillAddFullfoljd;
  const beslutDirty = !!beslutCode && (fieldsChanged || messageTouched);

  // The decision message is the composed beslutsmeddelande, with the fullföljdshänvisning (fetched from
  // Templating) appended at the end when the handläggare ticked the box.
  const buildDecisionMessage = async (): Promise<string | undefined> => {
    let message = messageValue.markup?.trim() ?? '';
    if (addFullfoljd) {
      const res = await getDocumentTemplateContent(FULLFOLJD_TEMPLATE_IDENTIFIER);
      if (!res.error && res.data) {
        message = message ? `${message}<p><br></p>${res.data}` : res.data;
      }
    }
    return message.length > 0 ? message : undefined;
  };

  const save = async (): Promise<boolean> => {
    // Nothing to save without a chosen beslut (mirrors the old Spara button's disabled guard); the central
    // save can fire from the sidebar for other reasons, so we must not POST an empty decision.
    if (!beslutCode) {
      return false;
    }
    setSaveError(undefined);
    setSaved(false);
    const decisionMessage = await buildDecisionMessage();
    const result = await createBeslut(errandId, {
      value: beslutCode,
      amount: amount ?? 0,
      decisionDate: date,
      periodFrom: fromDate,
      periodTo: toDate,
      decisionMessage,
    });
    if (result.error) {
      setSaveError('Det gick inte att spara beslutet');
      return false;
    }
    setSaved(true);
    // Reloads the saved beslut, which becomes the new baseline (so the form is no longer dirty).
    refresh();
    return true;
  };

  // Expose the save to the parent's central "Spara ärende" button — but only while there's something to
  // save (a dirty, unlocked beslut), so opening the tab alone doesn't light the button up. A stable wrapper
  // reads the latest save through a ref so registration only flips with the dirty/locked state.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (locked || !beslutDirty) {
      onRegisterSave?.(null);
      return;
    }
    onRegisterSave?.(() => saveRef.current());
    return () => {
      onRegisterSave?.(null);
    };
  }, [onRegisterSave, locked, beslutDirty]);

  if (draftLoading || beslutLoading) {
    return (
      <div className="flex justify-center my-32">
        <Spinner size={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      {locked ?
        <LockedBanner />
      : null}

      <h2 className="text-h3-sm md:text-h3-md m-0">Beslut</h2>
      {headerSlot}

      <LockFieldset locked={locked}>
        <div className="flex flex-col gap-24">
          <div className="flex flex-col gap-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-16">
              <FormControl id="beslut-datum" className="w-full">
                <FormLabel>Datum *</FormLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                  }}
                />
              </FormControl>

              <FormControl id="beslut-typ" className="w-full">
                <FormLabel>Beslut *</FormLabel>
                <Select
                  className="w-full"
                  value={beslutCode}
                  onChange={(event) => {
                    setBeslutCode(event.target.value);
                  }}
                >
                  <Select.Option value="">Välj beslut</Select.Option>
                  {options.map((option) => (
                    <Select.Option key={option.code} value={option.code ?? ''}>
                      {option.displayName ?? option.code}
                    </Select.Option>
                  ))}
                </Select>
                <span className="text-small text-dark-secondary mt-4">Rekommenderat beslut: {recommendationLabel}</span>
              </FormControl>

              <FormControl id="beslut-fran" className="w-full">
                <FormLabel>Från</FormLabel>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(event) => {
                    setFromDate(event.target.value);
                  }}
                />
              </FormControl>

              <FormControl id="beslut-till" className="w-full">
                <FormLabel>Till</FormLabel>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(event) => {
                    setToDate(event.target.value);
                  }}
                />
              </FormControl>
            </div>

            {/* Belopp is derived (0 for an avslag, otherwise the recommended amount), so it's shown
                      as a read-only summary rather than an input field. */}
            <div className="flex items-center justify-between gap-16 rounded-12 border-1 border-divider bg-background-200 px-16 py-12 max-w-[32rem]">
              <span className="text-small font-bold text-dark-secondary">Belopp att bevilja</span>
              <span className="text-h4-sm md:text-h4-md font-bold">{formatAmount(amount ?? 0)}</span>
            </div>

            {saveError && <p className="text-error-surface-primary m-0">{saveError}</p>}
            {saved && <p className="text-dark-secondary m-0">Beslutet sparades.</p>}
          </div>

          <Divider className="my-8" />

          <div className="flex justify-between items-center gap-16">
            <h2 className="text-h3-sm md:text-h3-md m-0">Beslutsmeddelande</h2>
            {/* Wrap so the preview button is one flex item — its fragment (Button + Modal) would
                      otherwise become two children and justify-between would push the button to the middle. */}
            <div>
              <PdfPreviewButton
                buildHtml={buildDecisionMessage}
                modalLabel="Förhandsgranska beslut"
                emptyMessage="Det finns inget beslutsmeddelande att förhandsgranska."
              />
            </div>
          </div>
          <BeslutMeddelande
            errandId={errandId}
            value={messageValue}
            onChange={setMessageValue}
            addFullfoljd={addFullfoljd}
            onAddFullfoljdChange={setAddFullfoljd}
            onUserEdit={() => {
              setMessageTouched(true);
            }}
          />
        </div>
      </LockFieldset>
    </div>
  );
};
