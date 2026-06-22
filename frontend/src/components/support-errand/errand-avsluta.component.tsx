'use client';

import { updateErrand } from '@services/errand-service/errand-service';
import { SectionApprovals, SectionKey } from '@services/section-approval-service';
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
 * "Avsluta ärende" button for the sidebar. When not every section is approved, asks the handläggare to
 * confirm before closing; otherwise closes directly. Closing sets the errand status to CLOSED.
 */
export const ErrandAvsluta: FC<{ errandId: string; approvals: SectionApprovals; onClosed: () => void }> = ({
  errandId,
  approvals,
  onClosed,
}) => {
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [closing, setClosing] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const unapproved = (
    [
      ['CALCULATION', approvals.calculation],
      ['PAYMENT', approvals.payment],
      ['DECISION', approvals.decision],
    ] as const
  )
    .filter(([, approval]) => !approval?.approved)
    .map(([key]) => SECTION_LABELS[key]);

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

  const onAvsluta = (): void => {
    if (unapproved.length > 0) {
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
        loading={closing}
        loadingText="Avslutar…"
        onClick={onAvsluta}
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
          <p className="m-0">
            Du har inte godkänt {unapproved.length === 1 ? 'sektionen' : 'sektionerna'}{' '}
            <strong>{unapproved.join(', ')}</strong>. Vill du avsluta ändå?
          </p>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
              setConfirmOpen(false);
            }}>
            Avbryt
          </Button>
          <Button color="vattjom" variant="primary" loading={closing} loadingText="Avslutar…" onClick={() => void close()}>
            Avsluta ändå
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
