/**
 * Läs-modell + svenska etiketter för en ekonomiskt bistånd-ansökans data (FinancialAssistanceData)
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
export interface SubmittedCost {
  costType?: string;
  appliedAmount?: number;
  otherSubType?: string;
  specification?: string;
  recipientOrPeriod?: string;
}
export interface SubmittedIncome {
  incomeType?: string;
  amount?: number;
  incomeDate?: string;
  recipient?: string;
}
export interface SubmittedPendingBenefit {
  benefitName?: string;
  applicantName?: string;
}
export interface SubmittedAsset {
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
export interface SubmittedPlanning {
  planningType?: string;
  person?: string;
  workExtent?: string;
  workDescription?: string;
  sickLeaveLevel?: string;
  sfiStudyPath?: string;
  sfiCourse?: string;
  otherDescription?: string;
}
export interface SubmittedPlannedActivity {
  activity?: string;
  person?: string;
  periodFrom?: string;
  periodTo?: string;
}
export interface SubmittedJobApplication {
  jobTitle?: string;
  employerAndPlace?: string;
  applicationDate?: string;
  person?: string;
}
export interface SubmittedPerson {
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

const MONTHS = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

export const swedishMonth = (month?: number): string =>
  month && month >= 1 && month <= 12 ? (MONTHS[month - 1] ?? '') : '';

const LABELS: Record<string, Record<string, string>> = {
  applicationType: { NEW: 'Nyansökan', RENEWAL: 'Återansökan', SUPPLEMENTARY: 'Tilläggsansökan' },
  maritalStatus: { SINGLE: 'Ensamstående', COHABITING: 'Gift eller sambo' },
  normType: { RIKSNORM: 'Riksnorm', OTHER_NORM: 'Annan norm' },
  periodChoice: { CURRENT_MONTH: 'Denna månad', NEXT_MONTH: 'Nästa månad', OTHER_BENEFIT: 'Annat bistånd' },
  housingForm: {
    NO_HOUSING_OR_INSTITUTION: 'Utan bostad eller bor på stödboende/institution',
    RENTAL: 'Hyresrätt',
    SUBLET: 'Andrahand',
    LODGER: 'Inneboende',
    CONDOMINIUM: 'Bostadsrätt',
    OWNED_HOUSE: 'Äger villa eller radhus',
    RENTED_HOUSE: 'Hyr villa eller radhus',
    LIVING_WITH_PARENTS: 'Bor hos föräldrar',
  },
  costType: {
    RENT: 'Hyra (inte parkering/garage)',
    ELECTRICITY: 'Elkostnad (totalsumma)',
    HOME_INSURANCE: 'Hemförsäkring (månadskostnad)',
    INTERNET: 'Internet',
    UNEMPLOYMENT_FUND: 'A-kassa',
    UNION_FEE: 'Fackföreningsavgift',
    TRAVEL_APPROVED: 'Resor till godkänd planering/aktivitet',
    TRAVEL_MEDICAL_TRANSPORT: 'Resor med sjukresor/färdtjänst till godkänd planering/aktivitet (egenavgift)',
    MEDICAL_CARE: 'Läkarvård (inom högkostnadsskydd)',
    MEDICINE: 'Medicin (inom högkostnadsskydd/förmån/egenavgift)',
    OTHER: 'Övrigt bistånd',
  },
  costOtherSubType: {
    OTHER: 'Annat',
    MUNICIPAL_FEES: 'Kommunala avgifter (förskola/hemtjänst)',
    ACUTE_DENTAL: 'Akut tandvård/basundersökning',
  },
  incomeType: {
    SALARY: 'Lön',
    SWISH_DEPOSITS: 'Swish/kontoinsättningar',
    OCCUPATIONAL_PENSION_INSURANCE: 'Tjänstepension/försäkringar (AFA, AMF, KPA, SPV etc)',
    CHILD_SUPPORT: 'Underhållsbidrag från den andra föräldern',
    RENT_SHARE_FROM_CHILD: 'Hyresdel från barn/inneboende',
    FINANCIAL_AID_OTHER_MUNICIPALITY: 'Ekonomiskt bistånd från annan kommun',
    OTHER_INCOME: 'Annan inkomst (lån, spelvinst, försörjning av tillgång, gåva, kontanter)',
  },
  assetCategory: {
    BANK_SAVINGS: 'Banktillgodohavande / sparande',
    REAL_ESTATE: 'Fastighet',
    COMPANY: 'Företag',
    VEHICLE: 'Fordon',
    OTHER: 'Konst, smycken eller andra övriga tillgångar',
  },
  propertyType: { BOSTADSRATT: 'Bostadsrätt', VILLA: 'Villa', FASTIGHET: 'Fastighet', FRITIDSHUS: 'Fritidshus' },
  vehicleType: {
    BIL: 'Bil',
    BAT: 'Båt',
    MC: 'MC',
    HUSVAGN: 'Husvagn',
    MOPED: 'Moped',
    SNOSKOTER: 'Snöskoter',
    ANNAT: 'Annat',
  },
  planningType: {
    WORK: 'Arbete',
    JOBSEEKING: 'Arbetssökande',
    SICK_LEAVE: 'Sjukskriven',
    SFI: 'SFI-studerande',
    OTHER: 'Annan planering',
  },
  paymentMethod: { BANK_ACCOUNT: 'Bankkonto', OTHER: 'Annat' },
  person: { APPLICANT: 'Sökande', CO_APPLICANT: 'Medsökande' },
};

/** Slår upp svensk etikett för ett enum-värde; faller tillbaka på koden om den saknas. */
export const faLabel = (group: keyof typeof LABELS | string, value?: string): string =>
  value ? (LABELS[group as string]?.[value] ?? value) : '';
