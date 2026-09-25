'use client';

import { getDigitalMailbox } from '@services/decision-notification-service';
import { finalizeErrand } from '@services/finalize-service';
import { getNormberakningDraft } from '@services/normberakning-service';
import { useUserStore } from '@services/user-service/user-service';
import { Button, Checkbox, FormControl, FormLabel, Modal, Textarea } from '@sk-web-gui/react';
import { buildDecisionMessage } from '@utils/decision-message';
import { FinalizeFollowUp, finalizeFollowUps } from '@utils/finalize-follow-ups';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { FinalizeFollowUps } from './finalize-follow-ups.component';
import { DecisionAttachments, SendDecisionAttachments } from './send-decision-attachments.component';

const ALL_LIFECARE_DOCUMENTS: DecisionAttachments = { includeDecision: true, includeCalculation: true, files: [] };

/**
 * "Skicka beräkning och beslut" for the administration bar. The dialog proposes a message to the sökande — for the
 * ansökan's month, signed by the handläggare — which they edit, and the documents that go with it: the beslut and
 * the beräkning from Lifecare, which they can take out, and PDFs from their computer. On Skicka the BFF finalizes the
 * errand in caremanagement from the beslut saved in Lifecare, then sends the message through the chosen channels
 * (Mina sidor and brev to begin with; digital brevlåda when the sökande has one). A refusal is shown in careM's or
 * the BFF's words. Anything that did not go through after the errand was decided is listed before the dialog closes,
 * since the errand cannot be finalized again.
 */
export const ErrandAvsluta: FC<{
  errandId: string;
  onFinalized: () => void;
}> = ({ errandId, onFinalized }) => {
  const { t } = useTranslation('errand');
  const caseworkerName = useUserStore(useShallow((state) => state.user.name));
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [minaSidor, setMinaSidor] = useState<boolean>(true);
  const [digitalBrevlada, setDigitalBrevlada] = useState<boolean>(false);
  const [brev, setBrev] = useState<boolean>(true);
  const [mailboxAvailable, setMailboxAvailable] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [attachments, setAttachments] = useState<DecisionAttachments>(ALL_LIFECARE_DOCUMENTS);
  // Set once the errand is decided but something after that did not go through.
  const [followUps, setFollowUps] = useState<FinalizeFollowUp[]>([]);
  const decided = followUps.length > 0;

  const openConfirm = async (): Promise<void> => {
    setChecking(true);
    setError(undefined);
    setMinaSidor(true);
    setBrev(true);
    setDigitalBrevlada(false);
    setAttachments(ALL_LIFECARE_DOCUMENTS);

    const [mailboxRes, draftRes] = await Promise.all([getDigitalMailbox(errandId), getNormberakningDraft(errandId)]);
    setMailboxAvailable(!mailboxRes.error && mailboxRes.data === true);
    setMessage(buildDecisionMessage(draftRes.data?.applicationMonth, caseworkerName));
    setChecking(false);
    setConfirmOpen(true);
  };

  const messageMissing = message.trim() === '';
  const noChannel = !minaSidor && !brev && !(digitalBrevlada && mailboxAvailable);

  const send = async (): Promise<void> => {
    setWorking(true);
    setError(undefined);
    const result = await finalizeErrand(
      errandId,
      {
        minaSidor,
        digitalBrevlada: digitalBrevlada && mailboxAvailable,
        brev,
        message,
        includeDecision: attachments.includeDecision,
        includeCalculation: attachments.includeCalculation,
      },
      attachments.files
    );
    setWorking(false);
    if (result.error || !result.data) {
      // Nothing was finalized; the BFF's message says why (caremanagement's own reason on a conflict).
      setError(result.message ?? t('decideAndPay.finalizeError'));
      return;
    }
    const remaining = finalizeFollowUps(result.data);
    if (remaining.length > 0) {
      setFollowUps(remaining);
      return;
    }
    setConfirmOpen(false);
    onFinalized();
  };

  const closeAfterFinalize = (): void => {
    setConfirmOpen(false);
    setFollowUps([]);
    onFinalized();
  };

  const closeModal = (): void => {
    if (decided) {
      closeAfterFinalize();
      return;
    }
    setConfirmOpen(false);
  };

  return (
    <div className="flex items-center gap-8">
      <Button
        color="vattjom"
        variant="primary"
        size="sm"
        loading={checking}
        loadingText={t('decideAndPay.preparing')}
        onClick={() => void openConfirm()}
      >
        {t('decideAndPay.button')}
      </Button>

      <Modal
        show={confirmOpen}
        onClose={closeModal}
        label={t('decideAndPay.button')}
        className={decided ? undefined : 'w-[72rem] max-w-[90vw]'}
      >
        {decided ?
          <>
            <Modal.Content>
              <FinalizeFollowUps followUps={followUps} />
            </Modal.Content>
            <Modal.Footer>
              <Button variant="primary" onClick={closeAfterFinalize}>
                {t('common:close')}
              </Button>
            </Modal.Footer>
          </>
        : <>
            <Modal.Content className="flex flex-col gap-24">
              <div className="flex flex-col gap-8">
                <span className="text-small font-bold">{t('decideAndPay.sendVia')}</span>
                <Checkbox
                  checked={minaSidor}
                  onChange={(event) => {
                    setMinaSidor(event.target.checked);
                  }}
                >
                  {t('decideAndPay.channels.minaSidor')}
                </Checkbox>
                {mailboxAvailable ?
                  <Checkbox
                    checked={digitalBrevlada}
                    onChange={(event) => {
                      setDigitalBrevlada(event.target.checked);
                    }}
                  >
                    {t('decideAndPay.channels.digitalMailbox')}
                  </Checkbox>
                : null}
                <Checkbox
                  checked={brev}
                  onChange={(event) => {
                    setBrev(event.target.checked);
                  }}
                >
                  {t('decideAndPay.channels.letter')}
                </Checkbox>
              </div>

              <FormControl id="send-decision-message" className="w-full">
                <FormLabel>{t('decideAndPay.messageLabel')}</FormLabel>
                <Textarea
                  className="w-full"
                  rows={9}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                  }}
                />
                {messageMissing ?
                  <p className="m-0 mt-8 text-small text-dark-secondary">{t('decideAndPay.messageRequired')}</p>
                : null}
              </FormControl>

              <SendDecisionAttachments value={attachments} onChange={setAttachments} />

              {error ?
                <p className="text-error-surface-primary m-0" role="alert">
                  {error}
                </p>
              : null}
            </Modal.Content>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeModal}>
                {t('common:cancel')}
              </Button>
              <Button
                color="vattjom"
                variant="primary"
                loading={working}
                loadingText={t('decideAndPay.executing')}
                disabled={messageMissing || noChannel}
                onClick={() => void send()}
              >
                {t('decideAndPay.send')}
              </Button>
            </Modal.Footer>
          </>
        }
      </Modal>
    </div>
  );
};
