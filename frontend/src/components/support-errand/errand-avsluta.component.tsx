'use client';

import { updateErrand } from '@services/errand-service/errand-service';
import { getSectionApprovals, SectionKey } from '@services/section-approval-service';
import { Button, Modal } from '@sk-web-gui/react';
import { FC, useState } from 'react';

// The status an errand gets when avslutat.
const CLOSED_STATUS = 'CLOSED';

const SECTION_LABELS: Record<SectionKey, string> = {
  CALCULATION: 'Normberäkning',
  PAYMENT: 'Utbetalning',
  DECISION: 'Beslut',
};

/**
 * "Avsluta ärende" button for the sidebar. Closing sets the errand status to CLOSED. When `checkApprovals`
 * is set (renewal errands), the approval state is fetched on click and the handläggare is asked to confirm
 * if not every section is approved; otherwise (new/supplementary errands, which have no approval sections)
 * a plain confirm is shown.
 */
export const ErrandAvsluta: FC<{ errandId: string; onClosed: () => void; checkApprovals?: boolean }> = ({
  errandId,
  onClosed,
  checkApprovals = true,
}) => {
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [unapproved, setUnapproved] = useState<string[]>([]);
  const [checking, setChecking] = useState<boolean>(false);
  const [closing, setClosing] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const close = async (): Promise<void> => {
    setClosing(true);
    setError(undefined);
    const result = await updateErrand(errandId, { status: CLOSED_STATUS });
    setClosing(false);
    if (result.error) {
      setError('Det gick inte att avsluta ärendet');
      return;
    }
    setConfirmOpen(false);
    onClosed();
  };

  const onAvsluta = async (): Promise<void> => {
    // No approval sections on this errand type — just confirm and close.
    if (!checkApprovals) {
      setUnapproved([]);
      setConfirmOpen(true);
      return;
    }
    setChecking(true);
    setError(undefined);
    const res = await getSectionApprovals(errandId);
    setChecking(false);
    const approvals = res.data ?? {};
    const pending = (
      [
        ['CALCULATION', approvals.calculation],
        ['PAYMENT', approvals.payment],
        ['DECISION', approvals.decision],
      ] as const
    )
      .filter(([, approval]) => !approval?.approved)
      .map(([key]) => SECTION_LABELS[key]);
    if (pending.length > 0) {
      setUnapproved(pending);
      setConfirmOpen(true);
      return;
    }
    void close();
  };

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-error-surface-primary m-0 text-small">{error}</p>}
      <Button
        color="vattjom"
        variant="primary"
        className="w-full"
        loading={checking || closing}
        loadingText="Avslutar…"
        onClick={() => void onAvsluta()}
      >
        Avsluta ärende
      </Button>

      <Modal
        show={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
        }}
        label="Avsluta ärende"
      >
        <Modal.Content>
          {unapproved.length > 0 ?
            <p className="m-0">
              Du har inte godkänt {unapproved.length === 1 ? 'sektionen' : 'sektionerna'}{' '}
              <strong>{unapproved.join(', ')}</strong>. Vill du avsluta ändå?
            </p>
          : <p className="m-0">Vill du avsluta ärendet?</p>}
        </Modal.Content>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmOpen(false);
            }}
          >
            Avbryt
          </Button>
          <Button color="vattjom" variant="primary" loading={closing} loadingText="Avslutar…" onClick={() => void close()}>
            {unapproved.length > 0 ? 'Avsluta ändå' : 'Avsluta'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
