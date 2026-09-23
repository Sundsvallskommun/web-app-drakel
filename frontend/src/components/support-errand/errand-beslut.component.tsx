'use client';

import { PdfPreviewButton } from '@components/common/pdf-preview-button.component';
import { useDecisionProposal } from '@hooks/use-decision-proposal';
import { useErrandBeslut } from '@hooks/use-errand-beslut';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { BeslutReasons, createBeslut } from '@services/beslut-service';
import { getDocumentTemplateContent } from '@services/document-template-service';
import { FormControl, FormLabel, Input, Select, Spinner } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { resolveBeslutAmount, resolveBeslutPeriod } from '@utils/beslut';
import { formatAmount } from '@utils/format-amount';
import dayjs from 'dayjs';
import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BeslutMeddelande } from './beslut-meddelande.component';
import { BeslutProposalBox } from './beslut-proposal-box.component';
import { ContentBox } from './content-box.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { LabeledValue } from './labeled-value.component';
import { LockedBanner, LockFieldset } from './lockable-section.component';

const todayDate = (): string => dayjs().format('YYYY-MM-DD');

const EMPTY_MESSAGE: TextEditorValue = { markup: '', plainText: '' };

// The fullföljdshänvisning (appeal instructions) lives in the Templating service; it's appended to the
// beslutsmeddelande when the handläggare ticks the box.
const FULLFOLJD_TEMPLATE_IDENTIFIER = 'drakel.fa.beslut.fullfoljdshanvisning';

/**
 * En orsaksrullista. Sökandes och medsökandes orsak plockas ur samma katalog, så de renderas
 * identiskt; en orsak utanför katalogen (från ett äldre beslut) läggs till sist av caremanagement och
 * följer därför med i listan.
 */
const ReasonField: FC<{
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}> = ({ id, label, value, options, onChange }) => {
  const { t } = useTranslation('decision');

  return (
    <FormControl id={id} className="w-full">
      <FormLabel>{label}</FormLabel>
      <Select
        className="w-full"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        <Select.Option value="">{t('details.selectReason')}</Select.Option>
        {options.map((option) => (
          <Select.Option key={option} value={option}>
            {option}
          </Select.Option>
        ))}
      </Select>
    </FormControl>
  );
};

/**
 * "Beslut" tab — the Nytt beslut form (mirroring Lifecare's BESLUT / BESLUTSMEDDELANDE view). Datum,
 * Beslut and Från/Till are prefilled from the automated recommendation (falling back to today and the
 * normberäkning month); Belopp is 0 for an avslag, otherwise the recommended amount. Beslutsfattare and
 * Tjänst are intentionally omitted.
 */
export const ErrandBeslut: FC<{
  errandId: string;
  locked?: boolean;
  /** Rendered to the right of the section heading (the "Markera som komplett" approval control). */
  headerSlot?: ReactNode;
  /** Registers this tab's save with the parent so the central "Spara ärende" button runs it (null = nothing to save). */
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void;
  /** The orsak picked so far — owned by the errand view so "Besluta och utbetala" can send it. */
  reasons?: BeslutReasons;
  onReasonsChange?: (reasons: BeslutReasons) => void;
}> = ({ errandId, locked = false, headerSlot, onRegisterSave, reasons, onReasonsChange }) => {
  const { t } = useTranslation('decision');
  const { draft, isLoading: draftLoading } = useErrandNormberakning(errandId);
  const { options, recommendation, savedBeslut, isLoading: beslutLoading, refresh } = useErrandBeslut(errandId);
  const { proposal } = useDecisionProposal(errandId);

  const period = useMemo(() => resolveBeslutPeriod(recommendation, draft), [recommendation, draft]);
  const today = useMemo(() => todayDate(), []);

  const [date, setDate] = useState<string>(todayDate);
  const [beslutCode, setBeslutCode] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(period.fromDate);
  const [toDate, setToDate] = useState<string>(period.toDate);
  // The orsak fields are inputs to finalize, not to the decision the form saves — a Decision carries
  // no reason. Until the handläggare picks one, the beslutsförslag's proposal is shown; "Besluta och
  // utbetala" sends the pick (or, without one, the BFF falls back to the same proposal).
  const reason = reasons?.reason ?? proposal.reason ?? '';
  const coApplicantReason = reasons?.coApplicantReason ?? proposal.coApplicantReason ?? '';
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
  // The beslutsförslag sits between the saved beslut and the older recommendation: caremanagement
  // derives it from the current draft, so it is a better answer than the stored recommendation, but a
  // handläggare's own saved beslut still wins.
  const prefillDate = savedBeslut?.decisionDate ?? recommendation?.decisionDate ?? today;
  const prefillBeslutCode = savedBeslut?.value ?? proposal.outcome ?? recommendation?.value ?? '';
  const prefillFrom = savedBeslut?.periodFrom ?? proposal.periodFrom ?? period.fromDate;
  const prefillTo = savedBeslut?.periodTo ?? proposal.periodTo ?? period.toDate;
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
  const amount = resolveBeslutAmount(
    selectedOption,
    savedBeslut?.amount ?? proposal.estimatedAmount ?? recommendation?.amount
  );

  const recommendationLabel = recommendedOption?.displayName ?? recommendation?.value ?? t('details.noRecommendation');

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
      setSaveError(t('details.saveError'));
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

  const header = (
    <ErrandSectionHeader title={t('header.title')} description={t('header.description')} action={headerSlot}>
      {locked ?
        <LockedBanner />
      : null}
    </ErrandSectionHeader>
  );

  if (draftLoading || beslutLoading) {
    return (
      <div className="flex flex-col gap-24">
        {header}
        <div className="flex justify-center my-32">
          <Spinner size={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      {header}

      {/* The proposal is read-only, so it sits outside the LockFieldset and stays legible when the
          section is approved. */}
      <BeslutProposalBox proposal={proposal} />

      <ContentBox title={t('details.title')}>
        <LockFieldset locked={locked}>
          <div className="flex flex-col gap-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-24 gap-y-16">
              <FormControl id="beslut-datum" className="w-full">
                <FormLabel>{t('details.date')}</FormLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                  }}
                />
              </FormControl>

              <FormControl id="beslut-typ" className="w-full">
                <FormLabel>{t('details.decision')}</FormLabel>
                <Select
                  className="w-full"
                  value={beslutCode}
                  onChange={(event) => {
                    setBeslutCode(event.target.value);
                  }}
                >
                  <Select.Option value="">{t('details.selectDecision')}</Select.Option>
                  {options.map((option) => (
                    <Select.Option key={option.code} value={option.code ?? ''}>
                      {option.displayName ?? option.code}
                    </Select.Option>
                  ))}
                </Select>
                <span className="text-small text-dark-secondary mt-4">
                  {t('details.recommended', { label: recommendationLabel })}
                </span>
              </FormControl>

              <FormControl id="beslut-fran" className="w-full">
                <FormLabel>{t('details.from')}</FormLabel>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(event) => {
                    setFromDate(event.target.value);
                  }}
                />
              </FormControl>

              <ReasonField
                id="beslut-orsak"
                label={t('details.reason')}
                value={reason}
                options={proposal.reasonOptions ?? []}
                onChange={(value) => {
                  onReasonsChange?.({ reason: value, coApplicantReason });
                }}
              />

              {/* Medsökandes orsak visas bara när det finns en medsökande att föreslå för. */}
              {proposal.coApplicantReason || proposal.previousDecision?.coApplicant ?
                <ReasonField
                  id="beslut-orsak-medsokande"
                  label={t('details.coApplicantReason')}
                  value={coApplicantReason}
                  options={proposal.reasonOptions ?? []}
                  onChange={(value) => {
                    onReasonsChange?.({ reason, coApplicantReason: value });
                  }}
                />
              : null}

              <FormControl id="beslut-till" className="w-full">
                <FormLabel>{t('details.to')}</FormLabel>
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
                as a read-only value rather than an input field. */}
            <LabeledValue label={t('details.amount')}>
              <span className="font-bold">{formatAmount(amount ?? 0)}</span>
            </LabeledValue>

            {saveError && <p className="text-error-surface-primary m-0">{saveError}</p>}
            {saved && <p className="text-dark-secondary m-0">{t('details.saved')}</p>}
          </div>
        </LockFieldset>
      </ContentBox>

      {/* The "Förhandsgranska" button is read-only, so it sits in the box header OUTSIDE the LockFieldset and
          remains clickable even when the section is approved/locked. Only the editor below is locked. */}
      <ContentBox
        title={t('message.title')}
        action={
          // Wrap so the preview button is one flex item — its fragment (Button + Modal) would otherwise
          // become two children and justify-between would push the button to the middle.
          <div>
            <PdfPreviewButton
              buildHtml={buildDecisionMessage}
              label={t('common:preview')}
              modalLabel={t('message.previewModalLabel')}
              emptyMessage={t('message.previewEmpty')}
            />
          </div>
        }
      >
        <LockFieldset locked={locked}>
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
        </LockFieldset>
      </ContentBox>
    </div>
  );
};
