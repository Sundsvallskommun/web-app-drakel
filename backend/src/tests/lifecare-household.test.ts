import { LifecareHouseholdRaw } from '@interfaces/lifecare-household.interface';
import { pickHousehold } from '@utils/lifecare-household';
import { describe, expect, it } from 'vitest';

const household = (householdId: number, fromDate: string, toDate: string): LifecareHouseholdRaw => ({
  householdId,
  personId: '19880209T050',
  fromDate,
  toDate,
  householdMembers: [],
  householdBonusChildren: [],
});

describe('pickHousehold', () => {
  it('picks the hushåll covering the first day of the beräkning', () => {
    const households = [household(1, '2025-01-01', '2026-06-15'), household(2, '2026-06-16', '')];

    expect(pickHousehold(households, '2026-05-01')?.householdId).toBe(1);
    expect(pickHousehold(households, '2026-09-01')?.householdId).toBe(2);
  });

  it('falls back to the open hushåll when none covers the day', () => {
    expect(pickHousehold([household(2, '2026-06-16', '')], '2026-01-01')?.householdId).toBe(2);
  });
});
