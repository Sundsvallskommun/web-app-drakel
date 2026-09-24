'use client';

import { PdfPreviewButton } from '@components/common/pdf-preview-button.component';
import { LifecareDecisionReasonView } from '@data-contracts/backend/data-contracts';
import { useBeslutRecommendation } from '@hooks/use-beslut-recommendation';
import { useDecisionPhrases } from '@hooks/use-decision-phrases';
import { useDecisionProposal } from '@hooks/use-decision-proposal';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { useLifecareCalculation } from '@hooks/use-lifecare-calculation';
import { useLifecareDecision } from '@hooks/use-lifecare-decision';
import { useLifecareDecisionReasons } from '@hooks/use-lifecare-decision-reasons';
import { useLifecareDecisionTypes } from '@hooks/use-lifecare-decision-types';
import { getDocumentTemplateContent } from '@services/document-template-service';
import { getLifecareDecisionPdf, saveLifecareDecision } from '@services/lifecare-decision-service';
import { Alert } from '@sk-web-gui/alert';
import { FormControl, FormLabel, Input, Select, Spinner } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { resolveBeslutAmount, resolveBeslutPeriod } from '@utils/beslut';
import { bifallPhraseFor, decisionTypeFor, hasChildren, toBeslutOutcome } from '@utils/beslut-outcome';
import { fillBeslutPhraseMarkup, markupToPlainText, withPhraseAppended } from '@utils/beslut-phrase-markup';
import { formatAmount } from '@utils/format-amount';
import { groupDecisionReasons } from '@utils/group-decision-reasons';
import { computeNormResult, fromLifecareSummary, isSurplus } from '@utils/norm-result';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import dayjs from 'dayjs';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BeslutMeddelande } from './beslut-meddelande.component';
import { BeslutProposalBox } from './beslut-proposal-box.component';
import { BeslutWriteProtectButton } from './beslut-write-protect-button.component';
import { ContentBox } from './content-box.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { LabeledValue } from './labeled-value.component';
import { LockFieldset } from './lockable-section.component';
import { NormResultLine } from './norm-result.component';

const todayDate = (): string => dayjs().format('YYYY-MM-DD');

const EMPTY_MESSAGE: TextEditorValue = { markup: '', plainText: '' };

// The fullföljdshänvisning (appeal instructions) lives in the Templating service; it's appended to the
// beslutsmeddelande when the handläggare ticks the box.
const FULLFOLJD_TEMPLATE_IDENTIFIER = 'drakel.fa.beslut.fullfoljdshanvisning';

/**
 * En orsaksrullista med Lifecares orsaker för vald beslutstyp, grupperade under sina rubriker som i
 * Lifecare. Sökandes och medsökandes orsak plockas ur samma katalog, så de renderas identiskt. Värdet är
 * Lifecares orsakskod.
 */
const ReasonField: FC<{
  id: string;
  label: string;
  value: string;
  options: LifecareDecisionReasonView[];
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
        {groupDecisionReasons(options).map((group) => (
          <Select.Optgroup key={group.header} label={group.header}>
            {group.reasons.map((option) => (
              <Select.Option key={option.code} value={String(option.code)}>
                {option.name}
              </Select.Option>
            ))}
          </Select.Optgroup>
        ))}
      </Select>
    </FormControl>
  );
};

/**
 * "Beslut" tab — the Nytt beslut form (mirroring Lifecare's BESLUT / BESLUTSMEDDELANDE view). Spara writes
 * the beslut straight to Lifecare — created the first time, changed after that — and the form is read back
 * from there. Beslutstyper and orsaker are Lifecare's own lists for the insats. Before anything is saved,
 * Datum, Beslut, Orsak and Från/Till are prefilled from careM's beslutsförslag and automated recommendation
 * (falling back to today and the normberäkning month), matched to Lifecare's types and orsaker; Belopp is 0
 * for an avslag, otherwise the recommended amount. The beslutsfattare is the handläggare who saves.
 * Förhandsgranska shows Lifecare's own print of the saved beslut.
 */
export const ErrandBeslut: FC<{
  errandId: string;
  /** Registers this tab's save with the parent so the central "Spara ärende" button runs it (null = nothing to save). */
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void;
}> = ({ errandId, onRegisterSave }) => {
  const { t } = useTranslation('decision');
  const { draft, isLoading: draftLoading } = useErrandNormberakning(errandId);
  const { recommendation, isLoading: recommendationLoading } = useBeslutRecommendation(errandId);
  const { types, isLoading: typesLoading, errorMessage: typesError } = useLifecareDecisionTypes(errandId);
  const { phrases } = useDecisionPhrases();
  const { stakeholders, isLoading: stakeholdersLoading } = useErrandStakeholders(errandId);
  const applicant = stakeholders.find((stakeholder) => stakeholder.role === 'APPLICANT');
  const applicantName = applicant ? stakeholderDisplayName(applicant) : '';
  const { decision: savedBeslut, isLoading: savedLoading, refresh } = useLifecareDecision(errandId);
  const { proposal } = useDecisionProposal(errandId);
  const { calculation } = useLifecareCalculation(errandId);
  // The normberäkning saved in Lifecare is the result, and its underskott what a bifall grants.
  const normResult = calculation?.summary ? fromLifecareSummary(calculation.summary) : computeNormResult(proposal);
  const calculatedDeficit = calculation?.summary ? Math.max(0, -calculation.summary.result) : undefined;
  // A beslut whose meddelande Lifecare has locked can no longer be changed from here.
  const formLocked = savedBeslut?.locked === true;

  const period = useMemo(() => resolveBeslutPeriod(recommendation, draft), [recommendation, draft]);
  const today = useMemo(() => todayDate(), []);

  const [date, setDate] = useState<string>(todayDate);
  // Lifecare's beslutstyp code, as the select holds it.
  const [decisionCode, setDecisionCode] = useState<string>('');
  const selectedType = types.find((type) => String(type.code) === decisionCode);
  const { reasons } = useLifecareDecisionReasons(selectedType?.code);
  const [fromDate, setFromDate] = useState<string>(period.fromDate);
  const [toDate, setToDate] = useState<string>(period.toDate);
  // The orsak (Lifecare's code) is saved with the beslut. Until the handläggare picks one, the saved
  // beslut's orsak stands — or, for a type not yet saved, the previous Lifecare beslut's (else the
  // beslutsförslag's), found by its wording among Lifecare's orsaker. The medsökandes is not saved: a household with a medsökande cannot be registered
  // from Drakel yet.
  const [pickedReason, setPickedReason] = useState<string>();
  const [pickedCoApplicantReason, setPickedCoApplicantReason] = useState<string>();
  const reasonCodeNamed = (name: string | undefined): string => {
    const match = name ? reasons.find((candidate) => candidate.name === name) : undefined;
    return match ? String(match.code) : '';
  };
  const prefillReason =
    savedBeslut && savedBeslut.decisionCode === selectedType?.code ?
      String(savedBeslut.reasonCode ?? '')
    : reasonCodeNamed(proposal.previousDecision?.reason ?? proposal.reason);
  const reason = pickedReason ?? prefillReason;
  const coApplicantReason = pickedCoApplicantReason ?? reasonCodeNamed(proposal.coApplicantReason);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState<boolean>(false);
  // The beslutsmeddelande (composed below the divider) is saved as the decision's decisionMessage.
  const [messageValue, setMessageValue] = useState<TextEditorValue>(EMPTY_MESSAGE);
  const [addFullfoljd, setAddFullfoljd] = useState<boolean>(true);
  // Whether the user has edited the message since it was last loaded/saved. Tracked via a flag (not a
  // markup diff) because Quill re-normalizes loaded HTML, which would otherwise read as a change.
  const [messageTouched, setMessageTouched] = useState<boolean>(false);

  // The form is read back from the beslut saved in Lifecare when there is one, otherwise from the
  // automated recommendation/period. This is also the baseline the dirty-check compares against.
  // The beslutsförslag sits between the saved beslut and the older recommendation: caremanagement
  // derives it from the current draft, so it is a better answer than the stored recommendation, but a
  // handläggare's own saved beslut still wins.
  const prefillDate = savedBeslut?.date ?? recommendation?.decisionDate ?? today;
  // careM decides the outcome — its beslutsförslag, counted on the normberäkning (Lifecare's once saved
  // there), else its stored recommendation. Drakel keeps no rule of its own; it only preselects the Lifecare
  // beslutstyp the outcome is registered as: 12 kap 1, 7 §§ bifall for a bifall or delvis bifall, avslag for
  // an avslag.
  const proposedOutcome = toBeslutOutcome(proposal.outcome ?? recommendation?.value);
  const proposedType = proposedOutcome ? decisionTypeFor(types, proposedOutcome) : undefined;
  const prefillBeslutCode =
    savedBeslut ? String(savedBeslut.decisionCode)
    : proposedType ? String(proposedType.code)
    : '';
  const prefillFrom = savedBeslut?.periodFrom ?? proposal.periodFrom ?? period.fromDate;
  const prefillTo = savedBeslut?.periodTo ?? proposal.periodTo ?? period.toDate;
  const prefillMessage = savedBeslut?.message ?? '';
  // A saved beslut's message already includes the fullföljdshänvisning (it was appended on save), so don't
  // default to appending it again; a fresh beslut defaults to adding it.
  const prefillAddFullfoljd = savedBeslut === null;

  // Prefill the form once the saved beslut / recommendation / period load (and again after a save reloads
  // them). User edits change the field state, not the prefill values, so they aren't clobbered.
  useEffect(() => {
    setDate(prefillDate);
    setDecisionCode(prefillBeslutCode);
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

  const amount = resolveBeslutAmount(
    selectedType?.outcome,
    savedBeslut?.amount ?? calculatedDeficit ?? proposal.estimatedAmount ?? recommendation?.amount
  );

  // A new beslut the normberäkning makes a bifall or a delvis bifall starts from the bifall
  // beslutsformulering — "Bifall månad", or "Bifall månad MED BARN" with barn in the beräkning — filled from
  // the errand. Only once, only into an empty message the handläggare has not touched, and only when
  // everything it is filled from has loaded.
  const grants = proposedOutcome === 'BIFALL' || proposedOutcome === 'DELAVSLAG';
  const bifallPhrase = grants ? bifallPhraseFor(phrases, hasChildren(draft)) : undefined;
  const autoFilled = useRef<boolean>(false);
  const messageEmpty = markupToPlainText(messageValue.markup ?? '').trim() === '';
  const readyToFill = !savedLoading && !stakeholdersLoading && savedBeslut === null && !messageTouched && messageEmpty;
  useEffect(() => {
    if (autoFilled.current || !readyToFill || bifallPhrase === undefined || amount === undefined) {
      return;
    }
    autoFilled.current = true;
    void getDocumentTemplateContent(bifallPhrase.identifier).then((content) => {
      if (content.error || content.data === undefined) {
        return;
      }
      const filled = fillBeslutPhraseMarkup(content.data, {
        applicantName,
        amount,
        periodFrom: fromDate || undefined,
        periodTo: toDate || undefined,
      });
      setMessageValue(withPhraseAppended(EMPTY_MESSAGE, filled));
    });
  }, [readyToFill, bifallPhrase, applicantName, amount, fromDate, toDate]);

  // The förslag names an outcome (bifall, avslag, delvis bifall); shown in the handläggare's words.
  const recommendationLabel =
    proposedOutcome ?
      t(`details.outcome.${proposedOutcome}`, { defaultValue: proposedOutcome })
    : t('details.noRecommendation');

  // The beslut counts as dirty — and the central "Spara ärende" button lights up — while nothing is saved
  // in Lifecare yet (finalize needs a saved beslut, even one taken straight from the förslag), and after
  // that when a field differs from the saved beslut or the user has edited the message. Opening the tab
  // on a saved beslut is not a change.
  const fieldsChanged =
    date !== prefillDate ||
    decisionCode !== prefillBeslutCode ||
    fromDate !== prefillFrom ||
    toDate !== prefillTo ||
    reason !== prefillReason ||
    addFullfoljd !== prefillAddFullfoljd;
  const beslutDirty = !!decisionCode && (savedBeslut === null || fieldsChanged || messageTouched);

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

  /** Saves the beslut in Lifecare; `writeProtect` saves it write-protected ("Spara och skrivskydda beslut"). */
  const saveBeslut = async (writeProtect: boolean): Promise<boolean> => {
    // Nothing to save without a chosen beslut (mirrors the old Spara button's disabled guard); the central
    // save can fire from the sidebar for other reasons, so we must not POST an empty decision.
    if (!selectedType) {
      return false;
    }
    setSaveError(undefined);
    setSaved(false);
    const decisionMessage = await buildDecisionMessage();
    const result = await saveLifecareDecision(errandId, {
      decisionCode: selectedType.code,
      date: date || undefined,
      periodFrom: fromDate || undefined,
      periodTo: toDate || undefined,
      amount: amount ?? 0,
      reasonCode: reason ? Number(reason) : undefined,
      decisionMessage,
      writeProtect: writeProtect || undefined,
    });
    if (result.error) {
      // Lifecare's own reason, or why Drakel will not send the beslut, when there is one.
      setSaveError(result.message ?? t('details.saveError'));
      return false;
    }
    setSaved(true);
    // Reloads the saved beslut, which becomes the new baseline (so the form is no longer dirty).
    refresh();
    return true;
  };

  // The central "Spara ärende" saves the beslut as it is, without write-protecting it.
  const save = (): Promise<boolean> => saveBeslut(false);

  // Expose the save to the parent's central "Spara ärende" button — but only while there's something to
  // save (a dirty, unlocked beslut), so opening the tab alone doesn't light the button up. A stable wrapper
  // reads the latest save through a ref so registration only flips with the dirty/locked state.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (formLocked || !beslutDirty) {
      onRegisterSave?.(null);
      return;
    }
    onRegisterSave?.(() => saveRef.current());
    return () => {
      onRegisterSave?.(null);
    };
  }, [onRegisterSave, formLocked, beslutDirty]);

  const header = <ErrandSectionHeader title={t('header.title')} description={t('header.description')} />;

  if (draftLoading || recommendationLoading || typesLoading || savedLoading) {
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
      {/* Up top, not beside the fields: Spara sits in the bar above, and a refused beslut must not go unseen. */}
      {saveError ?
        <Alert type="error">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Content.Title className="font-bold">{t('details.saveErrorTitle')}</Alert.Content.Title>
            <Alert.Content.Description>{saveError}</Alert.Content.Description>
          </Alert.Content>
        </Alert>
      : null}

      <BeslutProposalBox proposal={proposal} />

      {savedBeslut?.locked ?
        <p className="m-0 text-dark-secondary">{t('details.lockedInLifecare')}</p>
      : null}

      <ContentBox title={t('details.title')}>
        <LockFieldset locked={formLocked}>
          <div className="flex flex-col gap-24">
            {normResult ?
              <NormResultLine result={normResult} />
            : null}
            {/* Datum and the period on one row, beslutstyp and orsak on the next. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-24 gap-y-16">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-24 gap-y-16">
              <FormControl id="beslut-typ" className="w-full">
                <FormLabel>{t('details.decision')}</FormLabel>
                <Select
                  className="w-full"
                  value={decisionCode}
                  onChange={(event) => {
                    setDecisionCode(event.target.value);
                    // Another type has other orsaker, so the pick goes back to what that type proposes.
                    setPickedReason(undefined);
                    setPickedCoApplicantReason(undefined);
                  }}
                >
                  <Select.Option value="">{t('details.selectDecision')}</Select.Option>
                  {types.map((type) => (
                    <Select.Option key={type.code} value={String(type.code)}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
                {typesError ?
                  <span className="text-small text-error-surface-primary mt-4">
                    {t('details.typesError', { reason: typesError })}
                  </span>
                : null}
                <span className="text-small text-dark-secondary mt-4">
                  {t('details.recommended', { label: recommendationLabel })}
                </span>
              </FormControl>

              <ReasonField
                id="beslut-orsak"
                label={t('details.reason')}
                value={reason}
                options={reasons}
                onChange={setPickedReason}
              />

              {/* Medsökandes orsak visas bara när det finns en medsökande att föreslå för. */}
              {proposal.coApplicantReason || proposal.previousDecision?.coApplicant ?
                <ReasonField
                  id="beslut-orsak-medsokande"
                  label={t('details.coApplicantReason')}
                  value={coApplicantReason}
                  options={reasons}
                  onChange={setPickedCoApplicantReason}
                />
              : null}
            </div>

            {/* Belopp is derived (0 for an avslag, otherwise the recommended amount), so it's shown
                as a read-only value rather than an input field. A normöverskott has nothing to bevilja,
                so no belopp is shown then — the result line above already says it is an överskott. */}
            {normResult && isSurplus(normResult) ? null : (
              <LabeledValue label={t('details.amount')}>
                <span className="font-bold">{formatAmount(amount ?? 0)}</span>
              </LabeledValue>
            )}

            {saved && <p className="text-dark-secondary m-0">{t('details.saved')}</p>}
          </div>
        </LockFieldset>
      </ContentBox>

      {/* The "Förhandsgranska" button is read-only, so it sits in the box header OUTSIDE the LockFieldset and
          remains clickable even when the section is approved/locked. Only the editor below is locked. It shows
          Lifecare's print of the saved beslut, so it waits until what is on screen has been saved. */}
      <ContentBox
        title={t('message.title')}
        action={
          // Wrap so the preview button is one flex item — its fragment (Button + Modal) would otherwise
          // become two children and justify-between would push the button to the middle.
          <div>
            <PdfPreviewButton
              loadPdf={() => getLifecareDecisionPdf(errandId)}
              label={t('message.showPdf')}
              modalLabel={t('message.previewModalLabel')}
              disabled={!savedBeslut || beslutDirty}
            />
          </div>
        }
      >
        {!savedBeslut || beslutDirty ?
          <p className="m-0 mb-16 text-small text-dark-secondary">{t('message.previewNeedsSave')}</p>
        : null}
        <LockFieldset locked={formLocked}>
          <BeslutMeddelande
            phrases={phrases}
            applicantName={applicantName}
            amount={amount}
            periodFrom={fromDate || undefined}
            periodTo={toDate || undefined}
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

      <BeslutWriteProtectButton disabled={formLocked || !selectedType} onConfirm={() => saveBeslut(true)} />
    </div>
  );
};
