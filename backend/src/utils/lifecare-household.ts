import { LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import { LifecareHouseholdRaw } from '@interfaces/lifecare-household.interface';

import { HouseholdPersonView, LifecareHouseholdView } from '@/responses/lifecare-household.response';

/** Whether the hushåll covers the day: from its start, and to its end when it has one. */
const covers = (household: LifecareHouseholdRaw, day: string): boolean =>
  household.fromDate <= day && (household.toDate === '' || household.toDate >= day);

/** The hushåll the beräkning concerns: the one covering its first day, else the one still open. */
export const pickHousehold = (households: LifecareHouseholdRaw[], day: string): LifecareHouseholdRaw | undefined =>
  households.find(household => covers(household, day)) ?? households.find(household => household.toDate === '');

/** The hushåll's members and bonusbarn — those Lifecare has not marked for removal — and which the beräkning takes in. */
export const toHouseholdView = (household: LifecareHouseholdRaw | undefined, calculation: LifecareCalculationRaw): LifecareHouseholdView => {
  const inCalculation = (personId: string): boolean => calculation.calculationPersons.some(person => person.personId === personId);
  const members: HouseholdPersonView[] = (household?.householdMembers ?? [])
    .filter(member => !member.markedForRemoval)
    .map(member => ({
      personId: member.personId,
      personalNumber: member.personIdFormatted,
      name: member.name,
      relation: member.relationText ?? undefined,
      bonusChild: false,
      inCalculation: inCalculation(member.personId),
    }));
  const bonusChildren: HouseholdPersonView[] = (household?.householdBonusChildren ?? [])
    .filter(child => !child.markedForRemoval)
    .map(child => ({
      personId: child.personId,
      personalNumber: child.personIdFormatted,
      name: child.name,
      bonusChild: true,
      inCalculation: inCalculation(child.personId),
    }));
  return { persons: [...members, ...bonusChildren] };
};
