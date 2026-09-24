'use client';

import TextEditor from '@components/common/text-editor.component';
import { getDigitalMailbox } from '@services/decision-notification-service';
import { finalizeErrand } from '@services/finalize-service';
import { Button, Checkbox, FormControl, FormLabel, Modal } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { FinalizeFollowUp, finalizeFollowUps } from '@utils/finalize-follow-ups';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FinalizeFollowUps } from './finalize-follow-ups.component';

const EMPTY_MESSAGE: TextEditorValue = { markup: '', plainText: '' };

/**
 * "Besluta och utbetala" action for the administration bar. On confirm the BFF finalizes the errand in
 * caremanagement from the beslut saved in Lifecare — which records the decision and moves the process on
 * (the errand becomes GRANTED/REJECTED) — and then sends the beslut through the chosen channels (Mina sidor /
 * digital brevlåda / brev). The digital-brevlåda channel is only offered when the applicant has a reachable
 * mailbox. A refusal (no beslut or beräkning in Lifecare yet) is shown in careM's or the BFF's words. Anything
 * that did not go through after the errand was decided is listed in the dialog before it closes, since the
 * errand cannot be finalized again.
 */
export const ErrandAvsluta: FC<{
  errandId: string;
  onFinalized: () => void;
}> = ({ errandId, onFinalized }) => {
  const { t } = useTranslation('errand');
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  // Channels (all on by default); digital brevlåda is only shown/used when the applicant has a mailbox.
  const [minaSidor, setMinaSidor] = useState<boolean>(true);
  const [digitalBrevlada, setDigitalBrevlada] = useState<boolean>(true);
  const [brev, setBrev] = useState<boolean>(true);
  const [mailboxAvailable, setMailboxAvailable] = useState<boolean>(false);
  // The message channel starts off: the other channels send the beslut that already exists, while this
  // one sends something the handläggare has to write, and defaulting it on would press them to write it.
  const [sendMessage, setSendMessage] = useState<boolean>(false);
  const [message, setMessage] = useState<TextEditorValue>(EMPTY_MESSAGE);
  // Set once the errand is decided but something after that did not go through.
  const [followUps, setFollowUps] = useState<FinalizeFollowUp[]>([]);
  const decided = followUps.length > 0;

  const openConfirm = async (): Promise<void> => {
    setChecking(true);
    setError(undefined);
    setMinaSidor(true);
    setBrev(true);
    setSendMessage(false);
    setMessage(EMPTY_MESSAGE);

    const mailboxRes = await getDigitalMailbox(errandId);
    const available = !mailboxRes.error && mailboxRes.data === true;
    setMailboxAvailable(available);
    setDigitalBrevlada(available);
    setChecking(false);
    setConfirmOpen(true);
  };

  // Ticking the box is a statement of intent to send something, so an empty editor is a slip rather than
  // a choice — holding the button is kinder than deciding the errand with an empty message attached.
  const messageMissing = sendMessage && (message.plainText ?? '').trim() === '';

  const confirmAndFinalize = async (): Promise<void> => {
    setWorking(true);
    setError(undefined);
    // The written message is not carried anywhere yet: the finalize payload has no field for it, and
    // neither caremanagement nor Messaging has been asked to take one. The control is here so
    // verksamheten can judge the placement and the wording before it is wired.
    const result = await finalizeErrand(errandId, {
      minaSidor,
      digitalBrevlada: digitalBrevlada && mailboxAvailable,
      brev,
    });
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
        className={sendMessage && !decided ? 'w-[72rem] max-w-[90vw]' : undefined}
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
            <Modal.Content className="flex flex-col gap-16">
              <div className="flex flex-col gap-8">
                <span className="text-small text-dark-secondary">{t('decideAndPay.sendVia')}</span>
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
                <Checkbox
                  checked={sendMessage}
                  onChange={(event) => {
                    setSendMessage(event.target.checked);
                  }}
                >
                  {t('decideAndPay.channels.message')}
                </Checkbox>
              </div>

              {sendMessage ?
                <FormControl id="decide-and-pay-message" className="w-full">
                  <FormLabel>{t('decideAndPay.messageLabel')}</FormLabel>
                  <TextEditor
                    className="text-editor-with-toolbar w-full"
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                    }}
                  />
                  {messageMissing ?
                    <p className="m-0 mt-8 text-small text-dark-secondary">{t('decideAndPay.messageRequired')}</p>
                  : null}
                </FormControl>
              : null}

              {error ?
                <p className="text-error-surface-primary m-0">{error}</p>
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
                disabled={messageMissing}
                onClick={() => void confirmAndFinalize()}
              >
                {t('decideAndPay.button')}
              </Button>
            </Modal.Footer>
          </>
        }
      </Modal>
    </div>
  );
};
