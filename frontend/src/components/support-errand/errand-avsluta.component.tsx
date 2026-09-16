'use client';

import { getDigitalMailbox, sendDecisionNotification } from '@services/decision-notification-service';
import { updateErrand } from '@services/errand-service/errand-service';
import { getSectionApprovals, SectionKey } from '@services/section-approval-service';
import { Button, Checkbox, Modal } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

// The status an errand gets when avslutat.
const CLOSED_STATUS = 'CLOSED';

/**
 * "Besluta och utbetala" action for the administration bar. On confirm it sends the beslut to the applicant through
 * the chosen Messaging channels (Mina sidor / digital brevlåda / brev) — which renders the beslut PDF and
 * saves it as a DECISION attachment — and then closes the errand (status CLOSED). The digital-brevlåda
 * channel is only offered when the applicant has a reachable mailbox. When `checkApprovals` is set (renewal
 * errands) the handläggare is warned if not every section is approved.
 */
export const ErrandAvsluta: FC<{ errandId: string; onClosed: () => void; checkApprovals?: boolean }> = ({
  errandId,
  onClosed,
  checkApprovals = true,
}) => {
  const { t } = useTranslation('errand');
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [unapproved, setUnapproved] = useState<SectionKey[]>([]);
  const [checking, setChecking] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  // Channels (all on by default); digital brevlåda is only shown/used when the applicant has a mailbox.
  const [minaSidor, setMinaSidor] = useState<boolean>(true);
  const [digitalBrevlada, setDigitalBrevlada] = useState<boolean>(true);
  const [brev, setBrev] = useState<boolean>(true);
  const [mailboxAvailable, setMailboxAvailable] = useState<boolean>(false);

  const openConfirm = async (): Promise<void> => {
    setChecking(true);
    setError(undefined);
    setMinaSidor(true);
    setBrev(true);

    const mailboxRes = await getDigitalMailbox(errandId);
    const available = !mailboxRes.error && mailboxRes.data === true;
    setMailboxAvailable(available);
    setDigitalBrevlada(available);

    let pending: SectionKey[] = [];
    if (checkApprovals) {
      const res = await getSectionApprovals(errandId);
      const approvals = res.data ?? {};
      pending = (
        [
          ['CALCULATION', approvals.calculation],
          ['PAYMENT', approvals.payment],
          ['DECISION', approvals.decision],
        ] as const
      )
        .filter(([, approval]) => !approval?.approved)
        .map(([key]) => key);
    }
    setUnapproved(pending);
    setChecking(false);
    setConfirmOpen(true);
  };

  const confirmAndSend = async (): Promise<void> => {
    setWorking(true);
    setError(undefined);
    const sendRes = await sendDecisionNotification(errandId, {
      minaSidor,
      digitalBrevlada: digitalBrevlada && mailboxAvailable,
      brev,
    });
    if (sendRes.error) {
      setWorking(false);
      setError(t('decideAndPay.sendError'));
      return;
    }
    const result = await updateErrand(errandId, { status: CLOSED_STATUS });
    setWorking(false);
    if (result.error) {
      setError(t('decideAndPay.closeError'));
      return;
    }
    setConfirmOpen(false);
    // Closed; surface any channels that couldn't be reached (shown next to the button).
    const failedChannels = sendRes.data ?? [];
    setError(
      failedChannels.length > 0 ?
        t('decideAndPay.failedChannels', {
          channels: failedChannels.join(', '),
          interpolation: { escapeValue: false },
        })
      : undefined
    );
    onClosed();
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
      {error && <p className="text-error-surface-primary m-0 text-small">{error}</p>}

      <Modal
        show={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
        }}
        label={t('decideAndPay.button')}
      >
        <Modal.Content className="flex flex-col gap-16">
          {unapproved.length > 0 ?
            <p className="m-0">
              <Trans
                t={t}
                i18nKey="decideAndPay.unapproved"
                count={unapproved.length}
                values={{ sections: unapproved.map((section) => t(`decideAndPay.sections.${section}`)).join(', ') }}
                components={{ strong: <strong /> }}
              />
            </p>
          : null}

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
          </div>
        </Modal.Content>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmOpen(false);
            }}
          >
            {t('common:cancel')}
          </Button>
          <Button
            color="vattjom"
            variant="primary"
            loading={working}
            loadingText={t('decideAndPay.executing')}
            onClick={() => void confirmAndSend()}
          >
            {t('decideAndPay.button')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
