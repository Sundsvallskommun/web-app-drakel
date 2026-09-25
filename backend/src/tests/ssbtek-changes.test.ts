import { incomeTransferFor, toSsbtekChangesView } from '@utils/ssbtek-changes';
import { describe, expect, it } from 'vitest';

import { SsbtekChangeKindEnum, SsbtekChangeRoleEnum, SsbtekChanges } from '@/data-contracts/caremanagement/data-contracts';

const { ADD, CHANGE, GONE } = SsbtekChangeKindEnum;
const { APPLICANT, CO_APPLICANT } = SsbtekChangeRoleEnum;

const comparison: SsbtekChanges = {
  calculationId: 48213,
  isFinal: false,
  changes: [
    { kind: ADD, role: APPLICANT, incomeTypeId: 12, incomeType: 'Bostadsbidrag', ssbtekAmount: 4500 },
    { kind: ADD, role: CO_APPLICANT, incomeTypeId: 12, incomeType: 'Bostadsbidrag', ssbtekAmount: 1200 },
    { kind: ADD, role: APPLICANT, incomeTypeId: 20, incomeType: 'Underhållsstöd', ssbtekAmount: 1673 },
    { kind: CHANGE, role: APPLICANT, incomeTypeId: 3, incomeType: 'Lön', ssbtekAmount: 12400, lifecareAmount: 11900 },
    { kind: GONE, role: APPLICANT, incomeTypeId: 7, incomeType: 'Sjukpenning', lifecareAmount: 800 },
  ],
};

describe('toSsbtekChangesView', () => {
  it('offers only what the normberäkning lacks for transfer — an income already there is not transferred again', () => {
    const view = toSsbtekChangesView(comparison);

    expect(view.available).toBe(true);
    expect(view.changes.map(change => [change.incomeType, change.role, change.transferable])).toEqual([
      ['Bostadsbidrag', 'APPLICANT', true],
      ['Bostadsbidrag', 'CO_APPLICANT', true],
      ['Underhållsstöd', 'APPLICANT', true],
      ['Lön', 'APPLICANT', false],
      ['Sjukpenning', 'APPLICANT', false],
    ]);
  });

  it('offers nothing for transfer into a slutlig normberäkning', () => {
    const view = toSsbtekChangesView({ ...comparison, isFinal: true });

    expect(view.isFinal).toBe(true);
    expect(view.changes.some(change => change.transferable)).toBe(false);
  });
});

describe('incomeTransferFor', () => {
  const view = toSsbtekChangesView(comparison);

  it('writes one row per income type, with the sökandes and the medsökandes SSBTEK amounts, and tells careM what', () => {
    const transfer = incomeTransferFor(
      [
        { role: 'APPLICANT', incomeTypeId: 12 },
        { role: 'CO_APPLICANT', incomeTypeId: 12 },
        { role: 'APPLICANT', incomeTypeId: 20 },
      ],
      view,
    );

    expect(transfer.rows).toEqual([
      { typeId: 12, typeName: 'Bostadsbidrag', applicantCaseworkerAmount: 4500, coapplicantCaseworkerAmount: 1200 },
      { typeId: 20, typeName: 'Underhållsstöd', applicantCaseworkerAmount: 1673 },
    ]);
    expect(transfer.applied).toEqual([
      { role: 'APPLICANT', incomeType: 'Bostadsbidrag', amount: 4500 },
      { role: 'CO_APPLICANT', incomeType: 'Bostadsbidrag', amount: 1200 },
      { role: 'APPLICANT', incomeType: 'Underhållsstöd', amount: 1673 },
    ]);
  });

  it('refuses an income that is already in the normberäkning, so nothing is written twice', () => {
    expect(() => incomeTransferFor([{ role: 'APPLICANT', incomeTypeId: 3 }], view)).toThrow('Lön finns redan i normberäkningen');
  });

  it('refuses an income careM no longer offers', () => {
    expect(() => incomeTransferFor([{ role: 'CO_APPLICANT', incomeTypeId: 20 }], view)).toThrow(/kan inte längre överföras/);
  });
});
