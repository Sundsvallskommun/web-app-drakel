import { NormberakningDraft } from '@services/normberakning-service';
import dayjs from 'dayjs';

/**
 * A selectable beslut (decision) alternative. `isAvslag` marks a rejection, for which the paid amount
 * is always 0 (see {@link resolveBeslutAmount}).
 *
 * TODO(api): the catalog of beslut alternatives is not exposed by caremanagement yet — there is no
 * DECISION lookup kind (only CATEGORY/STATUS/TYPE/ROLE/CONTACT_REASON) and the decisions sub-resource
 * is "set aside for now" in the BFF (see AGENTS.md). The placeholder list below lets the foundation
 * render; replace it with an API-backed service once the endpoint exists.
 */
export interface BeslutOption {
  code: string;
  label: string;
  isAvslag: boolean;
}

/** Placeholder beslut alternatives mirroring the Lifecare "Beslut" dropdown until the API exposes them. */
export const PLACEHOLDER_BESLUT_OPTIONS: BeslutOption[] = [
  { code: 'EK_BIFALL', label: 'EK Ekonomiskt bistånd 4 kap 1 § SoL, bifall', isAvslag: false },
  { code: 'EK_DELVIS', label: 'EK Ekonomiskt bistånd 4 kap 1 § SoL, delvis bifall', isAvslag: false },
  { code: 'EK_AVSLAG', label: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag', isAvslag: true },
];

/**
 * The paid amount for a beslut: 0 for a rejection (avslag), otherwise the recommended amount from the
 * normberäkning. Returns undefined when no decision is selected and no recommendation is available.
 */
export const resolveBeslutAmount = (
  option: BeslutOption | undefined,
  recommendedAmount: number | undefined
): number | undefined => {
  if (option?.isAvslag) {
    return 0;
  }
  return recommendedAmount;
};

/** The application period (Från/Till) a beslut concerns. */
export interface BeslutPeriod {
  fromDate: string;
  toDate: string;
}

/**
 * The period the beslut concerns, prefilled for the month the application covers. Uses the
 * normberäkning draft's calculation dates when available, otherwise falls back to the current
 * calendar month.
 */
export const resolveBeslutPeriod = (draft: NormberakningDraft | undefined): BeslutPeriod => {
  if (draft?.calculationFromDate && draft?.calculationToDate) {
    return { fromDate: draft.calculationFromDate, toDate: draft.calculationToDate };
  }
  return {
    fromDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    toDate: dayjs().endOf('month').format('YYYY-MM-DD'),
  };
};
