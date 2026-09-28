import { LifecareSectionStatusView } from '@/responses/lifecare-section-status.response';

// The one outcome that grants nothing, so needs no utbetalning.
const REJECTING_OUTCOME = 'AVSLAG';

/**
 * Why the errand cannot be sent yet, or undefined when everything the beslut rests on is done in Lifecare: the
 * beräkning saved as slutlig (careM's finalize does not check that), the beslut saved, and — for a beslut that
 * grants something — the utbetalning registered.
 *
 * @param status The Beräkning/Beslut/Utbetalning checks, as careM reads them from Lifecare
 * @param outcome The saved beslut's outcome (BIFALL, AVSLAG …); undefined when there is none
 */
export const finalizeBlocker = (status: LifecareSectionStatusView, outcome: string | undefined): string | undefined => {
  if (!status.calculationFinalized) {
    return 'Spara normberäkningen som slutlig innan du skickar beräkning och beslut.';
  }
  if (!status.decisionSaved) {
    return 'Spara beslutet innan du skickar beräkning och beslut.';
  }
  const grants = outcome !== undefined && outcome !== REJECTING_OUTCOME;
  if (grants && !status.paymentRegistered) {
    return 'Registrera utbetalningen innan du skickar beräkning och beslut.';
  }
  return undefined;
};
