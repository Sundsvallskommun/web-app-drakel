import { HttpException } from '@exceptions/HttpException';

import {
  AppliedSsbtekChange,
  AppliedSsbtekChangeRoleEnum,
  SsbtekChange,
  SsbtekChangeKindEnum,
  SsbtekChanges,
} from '@/data-contracts/caremanagement/data-contracts';
import { SsbtekTransferIncomeDto } from '@/dtos/ssbtek-transfer.dto';
import { SsbtekChangesView, SsbtekIncomeChangeView } from '@/responses/ssbtek-changes.response';

const CONFLICT = 409;

/** Nothing to compare yet: the normberäkning is not saved in Lifecare (or the errand is decided). */
export const NO_SSBTEK_CHANGES: SsbtekChangesView = { available: false, isFinal: false, changes: [] };

/**
 * Whether an income may be transferred: only one the normberäkning lacks (ADD), of a known type and with an amount,
 * into a beräkning that is not slutlig. One already in the normberäkning is not transferred again — careM's spärr.
 */
const isTransferable = (change: SsbtekChange, isFinal: boolean): boolean =>
  change.kind === SsbtekChangeKindEnum.ADD && !isFinal && change.incomeTypeId !== undefined && change.ssbtekAmount !== undefined;

const toIncomeChangeView = (change: SsbtekChange, isFinal: boolean): SsbtekIncomeChangeView[] =>
  change.kind && change.role
    ? [
        {
          kind: change.kind,
          role: change.role,
          incomeTypeId: change.incomeTypeId,
          incomeType: change.incomeType ?? '',
          ssbtekAmount: change.ssbtekAmount,
          lifecareAmount: change.lifecareAmount,
          transferable: isTransferable(change, isFinal),
        },
      ]
    : [];

/** careM's comparison as the SSBTEK page shows it: each disagreement, and which of them can be transferred. */
export const toSsbtekChangesView = (changes: SsbtekChanges): SsbtekChangesView => {
  const isFinal = changes.isFinal ?? false;
  return { available: true, isFinal, changes: (changes.changes ?? []).flatMap(change => toIncomeChangeView(change, isFinal)) };
};

/** A normberäkning income row: one income type, with the sökandes and/or the medsökandes amount. */
interface IncomeRow {
  typeId: number;
  typeName: string;
  applicantCaseworkerAmount?: number;
  coapplicantCaseworkerAmount?: number;
}

/** The income rows to write, and what to tell careM was written. */
export interface SsbtekIncomeTransfer {
  rows: IncomeRow[];
  applied: AppliedSsbtekChange[];
}

/**
 * The normberäkning income rows for the incomes the handläggare picked: one row per income type, carrying the
 * sökandes and the medsökandes amounts as the normberäkning keeps them. The amounts are SSBTEK's from careM's
 * comparison, never the caller's. A picked income that cannot be transferred — already in the normberäkning, or no
 * longer reported — refuses the whole transfer, so nothing is written twice.
 */
export const incomeTransferFor = (picked: SsbtekTransferIncomeDto[], view: SsbtekChangesView): SsbtekIncomeTransfer => {
  const rowsByType = new Map<number, IncomeRow>();
  const applied: AppliedSsbtekChange[] = [];
  for (const income of picked) {
    const change = view.changes.find(candidate => candidate.role === income.role && candidate.incomeTypeId === income.incomeTypeId);
    if (!change?.transferable || change.ssbtekAmount === undefined) {
      throw new HttpException(
        CONFLICT,
        `${change?.incomeType ?? 'Inkomsten'} finns redan i normberäkningen eller kan inte längre överföras från SSBTEK. Läs in listan igen.`,
      );
    }
    const row = rowsByType.get(income.incomeTypeId) ?? { typeId: income.incomeTypeId, typeName: change.incomeType };
    rowsByType.set(income.incomeTypeId, {
      ...row,
      ...(income.role === 'APPLICANT' ? { applicantCaseworkerAmount: change.ssbtekAmount } : { coapplicantCaseworkerAmount: change.ssbtekAmount }),
    });
    applied.push({ role: AppliedSsbtekChangeRoleEnum[income.role], incomeType: change.incomeType, amount: change.ssbtekAmount });
  }
  return { rows: [...rowsByType.values()], applied };
};
