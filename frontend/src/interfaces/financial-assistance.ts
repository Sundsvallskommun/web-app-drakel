import dayjs from 'dayjs';
import type { TFunction } from 'i18next';

/**
 * Läs-modell + (översatta) etiketter för en ekonomiskt bistånd-ansökans data (FinancialAssistanceData)
 * som medborgaren skickat in från Mina sidor. Visas skrivskyddat i handläggargränssnittet under
 * fliken "Ärendeuppgifter". Speglar caremanagement-kontraktet för de fält som renderas; backend
 * släpper igenom `data` på errandet men frontend-kontraktets Errand-typ saknar det, så typerna
 * definieras här.
 */

export interface SubmittedChild {
  firstName?: string;
  lastName?: string;
  name?: string;
  schoolName?: string;
}
interface SubmittedCost {
  costType?: string;
  appliedAmount?: number;
  otherSubType?: string;
  specification?: string;
  recipientOrPeriod?: string;
}
interface SubmittedIncome {
  incomeType?: string;
  amount?: number;
  incomeDate?: string;
  recipient?: string;
}
interface SubmittedPendingBenefit {
  benefitName?: string;
  applicantName?: string;
}
interface SubmittedAsset {
  assetCategory?: string;
  value?: number;
  description?: string;
  propertyType?: string;
  purchaseYear?: number;
  purchasePrice?: number;
  companyName?: string;
  companyAssetSum?: number;
  vehicleType?: string;
  registrationNumber?: string;
  purchaseDate?: string;
}
interface SubmittedPlanning {
  planningType?: string;
  person?: string;
  workExtent?: string;
  workDescription?: string;
  sickLeaveLevel?: string;
  /** First day of the sick-leave period on the medical certificate (yyyy-MM-dd). */
  sickLeaveFrom?: string;
  /** Last day of the sick-leave period on the medical certificate (yyyy-MM-dd). */
  sickLeaveTo?: string;
  sfiStudyPath?: string;
  sfiCourse?: string;
  otherDescription?: string;
}
interface SubmittedPlannedActivity {
  activity?: string;
  person?: string;
  periodFrom?: string;
  periodTo?: string;
}
interface SubmittedJobApplication {
  jobTitle?: string;
  employerAndPlace?: string;
  applicationDate?: string;
  person?: string;
}
interface SubmittedPerson {
  role?: string;
  paymentMethod?: string;
  clearingNumber?: string;
  accountNumber?: string;
  otherPaymentDescription?: string;
  email?: string;
  phone?: string;
  needsInterpreter?: boolean;
  interpreterLanguage?: string;
}
export interface FinancialAssistanceData {
  applicationType?: string;
  maritalStatus?: string;
  periodMonth?: number;
  periodYear?: number;
  periodChoice?: string;
  normType?: string;
  otherBenefitDescription?: string;
  livelihoodDescription?: string;
  hasChildrenUnder21?: boolean;
  housingForm?: string;
  housingPersonCount?: number;
  housingRoomsPlusKitchen?: number;
  housingDescription?: string;
  children?: SubmittedChild[];
  costs?: SubmittedCost[];
  incomes?: SubmittedIncome[];
  pendingBenefits?: SubmittedPendingBenefit[];
  assets?: SubmittedAsset[];
  persons?: SubmittedPerson[];
  plannings?: SubmittedPlanning[];
  plannedActivities?: SubmittedPlannedActivity[];
  jobApplications?: SubmittedJobApplication[];
  staysInMunicipality?: boolean;
  stayDescription?: string;
  attestation?: boolean;
}

/** The enum groups whose code labels live under `application:labels.<group>.<code>`. */
type FinancialAssistanceLabelGroup =
  | 'applicationType'
  | 'maritalStatus'
  | 'normType'
  | 'periodChoice'
  | 'housingForm'
  | 'costType'
  | 'costOtherSubType'
  | 'incomeType'
  | 'assetCategory'
  | 'propertyType'
  | 'vehicleType'
  | 'planningType'
  | 'paymentMethod';

/** The translated label for an enum code; falls back to the code itself when there's no translation. */
export const faLabel = (t: TFunction, group: FinancialAssistanceLabelGroup, value?: string): string =>
  value ? t(`application:labels.${group}.${value}`, { defaultValue: value }) : '';

/** The translated label for a person role (APPLICANT/CO_APPLICANT); falls back to the code itself. */
export const faPersonLabel = (t: TFunction, role?: string): string =>
  role ? t(`common:role.${role}`, { defaultValue: role }) : '';

/** The application period as month name + year in the UI language, e.g. "januari 2026" / "January 2026". */
export const formatPeriodMonth = (month: number | undefined, year: number | undefined, language: string): string =>
  month && year && month >= 1 && month <= 12 ?
    dayjs(new Date(year, month - 1, 1))
      .locale(language === 'en' ? 'en' : 'sv')
      .format('MMMM YYYY')
  : '';
