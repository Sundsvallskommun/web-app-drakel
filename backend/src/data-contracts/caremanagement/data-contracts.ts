/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum Direction {
  ASC = "ASC",
  DESC = "DESC",
}

export interface Problem {
  /** @format uri */
  instance?: string;
  /** @format uri */
  type?: string;
  title?: string;
  detail?: string;
  /** @format int32 */
  status?: number;
}

export interface ConstraintViolationProblem {
  /** @format uri */
  type?: string;
  /** @format int32 */
  status?: number;
  violations?: Violation[];
  title?: string;
  /** @format uri */
  instance?: string;
  detail?: string;
  causeAsProblem?: ThrowableProblem;
}

export interface ThrowableProblem {
  /** @format uri */
  type?: string;
  title?: string;
  /** @format int32 */
  status?: number;
  detail?: string;
  /** @format uri */
  instance?: string;
  causeAsProblem?: any;
}

export interface Violation {
  field?: string;
  message?: string;
}

/** Request to create or replace a financial assistance payment on an errand. */
export interface PaymentRequest {
  /** Provenance, defaults to CASEWORKER when omitted. RPA POSTs LIFECARE (with lifecareId) to surface a payment read out of Lifecare onto the errand. */
  source?: PaymentRequestSourceEnum;
  /**
   * The payment's id in Lifecare. Set by RPA when surfacing a LIFECARE-sourced payment (the idempotency key) or when stamping back the id of a registered caseworker payment.
   * @minLength 0
   * @maxLength 64
   */
  lifecareId?: string;
  /**
   * The type of money paid out. Unconstrained — the value set comes from Lifecare and isn't known yet.
   * @minLength 0
   * @maxLength 64
   */
  moneyType?: string;
  /**
   * The date the payment is/was made
   * @format date
   */
  paymentDate?: string;
  /** The payment amount */
  amount?: number;
  /**
   * The application month the payment concerns
   * @pattern ^\d{4}-(0[1-9]|1[0-2])$
   */
  applicationMonth?: string;
  /**
   * The accounting code (kontering) the bistånd is booked against. Free text: FamilyCare exposes no catalogue of accounting codes over the API.
   * @minLength 0
   * @maxLength 64
   */
  accountingCode?: string;
  /** Stakeholder ids the payment is reported on */
  reportedOnStakeholderIds?: string[];
  /**
   * The accounting date for the payment
   * @format date
   */
  accountingDate?: string;
  /** Whether the payment is excluded from being paid out */
  excludedFromPayment?: boolean;
  /**
   * The stakeholder id of the payee
   * @minLength 0
   * @maxLength 64
   */
  payeeStakeholderId?: string;
  /**
   * How the payment is made. Unconstrained — the value set comes from Lifecare and isn't known yet.
   * @minLength 0
   * @maxLength 64
   */
  paymentMethod?: string;
  /**
   * The payee's name
   * @minLength 0
   * @maxLength 255
   */
  payeeName?: string;
  /**
   * The payee's address
   * @minLength 0
   * @maxLength 255
   */
  payeeAddress?: string;
  /**
   * The payee's c/o line
   * @minLength 0
   * @maxLength 255
   */
  payeeCareOf?: string;
  /**
   * The payee's zip code
   * @minLength 0
   * @maxLength 16
   */
  payeeZipCode?: string;
  /**
   * The payee's city
   * @minLength 0
   * @maxLength 255
   */
  payeeCity?: string;
  /**
   * The payee's bank clearing number
   * @minLength 0
   * @maxLength 64
   */
  clearingNumber?: string;
  /**
   * The payee's bank account number
   * @minLength 0
   * @maxLength 64
   */
  accountNumber?: string;
  /**
   * The local payment number, when applicable
   * @minLength 0
   * @maxLength 64
   */
  localPaymentNumber?: string;
  /**
   * The invoice number, when applicable
   * @minLength 0
   * @maxLength 64
   */
  invoiceNumber?: string;
  /** Whether the payment uses OCR */
  usesOcr?: boolean;
  /** Free-text message lines printed on the payment */
  messageLines?: string[];
}

/** A financial assistance payment (utbetalning) on an errand. */
export interface Payment {
  /** The payment id */
  id?: string;
  /** Provenance: CASEWORKER for one authored in Draken, LIFECARE for one read out of Lifecare by RPA and surfaced here on the errand. */
  source?: PaymentSourceEnum;
  /** The payment's id in Lifecare once it exists there — null until RPA has registered a caseworker-authored payment; always set for a LIFECARE-sourced one. */
  lifecareId?: string;
  /** Server-managed lifecycle status. DRAFT on create; moves to QUEUED / EFFECTUATED / FAILED as the robot processes the REGISTER_PAYMENT RPA task. */
  status?: PaymentStatusEnum;
  /** The type of money paid out. Unconstrained — the value set comes from Lifecare and isn't known yet. */
  moneyType?: string;
  /**
   * The date the payment is/was made
   * @format date
   */
  paymentDate?: string;
  /** The payment amount */
  amount?: number;
  /** The application month the payment concerns, yyyy-MM */
  applicationMonth?: string;
  /** The accounting code (kontering) the bistånd is booked against. Free text: FamilyCare exposes no catalogue of accounting codes over the API. */
  accountingCode?: string;
  /** Stakeholder ids the payment is reported on */
  reportedOnStakeholderIds?: string[];
  /**
   * The accounting date for the payment
   * @format date
   */
  accountingDate?: string;
  /** Whether the payment is excluded from being paid out */
  excludedFromPayment?: boolean;
  /** The stakeholder id of the payee */
  payeeStakeholderId?: string;
  /** How the payment is made. Unconstrained — the value set comes from Lifecare and isn't known yet. */
  paymentMethod?: string;
  /** The payee's name */
  payeeName?: string;
  /** The payee's address */
  payeeAddress?: string;
  /** The payee's c/o line */
  payeeCareOf?: string;
  /** The payee's zip code */
  payeeZipCode?: string;
  /** The payee's city */
  payeeCity?: string;
  /** The payee's bank clearing number */
  clearingNumber?: string;
  /** The payee's bank account number */
  accountNumber?: string;
  /** The local payment number, when applicable */
  localPaymentNumber?: string;
  /** The invoice number, when applicable */
  invoiceNumber?: string;
  /** Whether the payment uses OCR */
  usesOcr?: boolean;
  /** Free-text message lines printed on the payment */
  messageLines?: string[];
  /**
   * When the payment was created
   * @format date-time
   */
  created?: string;
  /**
   * When the payment was last modified
   * @format date-time
   */
  modified?: string;
}

/** Request to create or replace a financial assistance monitoring on an errand. */
export interface MonitoringRequest {
  /** Provenance, defaults to CASEWORKER when omitted. RPA POSTs LIFECARE (with lifecareId) to surface a monitoring read out of Lifecare onto the errand. */
  source?: MonitoringRequestSourceEnum;
  /**
   * The monitoring's id in Lifecare. Set by RPA when surfacing a LIFECARE-sourced monitoring (the idempotency key) or when stamping back the id of a mirrored caseworker monitoring.
   * @minLength 0
   * @maxLength 64
   */
  lifecareId?: string;
  /**
   * Short headline for the monitoring
   * @minLength 0
   * @maxLength 255
   */
  title: string;
  /** Free-text details of what to watch for */
  description?: string;
  /**
   * When the watch becomes relevant (monitoringsdatum)
   * @format date
   */
  startDate: string;
  /**
   * When the watch ends — open-ended when omitted. Must not be before the start date.
   * @format date
   */
  endDate?: string;
  /**
   * The caseworker who created the monitoring
   * @minLength 0
   * @maxLength 64
   */
  createdBy?: string;
}

/** A financial assistance monitoring (date-bound watch/reminder) on an errand. */
export interface Monitoring {
  /** The monitoring id */
  id?: string;
  /** Provenance: CASEWORKER for one authored in Draken (RPA mirrors it onto the person in Lifecare), LIFECARE for one read out of Lifecare by RPA and surfaced here on the errand. */
  source?: MonitoringSourceEnum;
  /** The monitoring's id in Lifecare once it exists there — null until RPA has mirrored a caseworker-authored monitoring; always set for a LIFECARE-sourced one. */
  lifecareId?: string;
  /** Short headline for the monitoring */
  title?: string;
  /** Free-text details of what to watch for */
  description?: string;
  /**
   * When the watch becomes relevant (monitoringsdatum)
   * @format date
   */
  startDate?: string;
  /**
   * When the watch ends — open-ended when omitted
   * @format date
   */
  endDate?: string;
  /** The caseworker who created the monitoring */
  createdBy?: string;
  /**
   * When the monitoring was created
   * @format date-time
   */
  created?: string;
  /**
   * When the monitoring was last updated
   * @format date-time
   */
  updated?: string;
}

/** NamespaceConfig model */
export interface NamespaceConfig {
  /**
   * Unique identifier
   * @format int64
   */
  id?: number;
  /**
   * Display name of the namespace
   * @minLength 0
   * @maxLength 255
   */
  displayName?: string;
  /**
   * Short code for the namespace
   * @minLength 0
   * @maxLength 16
   */
  shortCode?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * Modified timestamp
   * @format date-time
   */
  modified?: string;
}

/** Lookup model - metadata entry (category, status, type, role, contact reason) */
export interface Lookup {
  /**
   * Name (machine-friendly key) of the lookup
   * @minLength 0
   * @maxLength 255
   */
  name?: string;
  /**
   * Display name
   * @minLength 0
   * @maxLength 255
   */
  displayName?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * Modified timestamp
   * @format date-time
   */
  modified?: string;
}

/** Errand envelope */
export interface Errand {
  /** Unique identifier of the errand */
  id?: string;
  /** Municipality id */
  municipalityId?: string;
  /** Namespace */
  namespace?: string;
  /** Human-readable errand number */
  errandNumber?: string;
  /**
   * Errand type slug. Types whose module owns a dedicated create endpoint (e.g. financial-assistance) are rejected on this generic endpoint and must be created through that endpoint; any other slug is accepted as-is.
   * @minLength 0
   * @maxLength 64
   */
  typeSlug?: string;
  /**
   * Title for the errand
   * @minLength 0
   * @maxLength 255
   */
  title?: string;
  /**
   * Status of the errand
   * @minLength 0
   * @maxLength 64
   */
  status?: string;
  /** Description of the errand */
  description?: string;
  /**
   * Priority of the errand
   * @minLength 0
   * @maxLength 16
   */
  priority?: string;
  /**
   * User id of the reporter
   * @minLength 0
   * @maxLength 64
   */
  reporterUserId?: string;
  /**
   * User id of the assignee
   * @minLength 0
   * @maxLength 64
   */
  assignedUserId?: string;
  /** Denormalized display name of the errand's applicant, maintained from the APPLICANT stakeholder. Sortable and searchable on the errand list (e.g. ?sort=applicantName,asc). Null for errand types with no applicant. */
  applicantName?: string;
  /**
   * Name of the Operaton process definition associated with the errand. Recorded on the errand; the core create endpoint does not itself start a process — process start, when applicable, is handled per errand type by a type module reacting to the errand-created domain event.
   * @minLength 0
   * @maxLength 128
   */
  processDefinitionName?: string;
  /** Id of the Operaton process instance started for this errand */
  processInstanceId?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * Modified timestamp
   * @format date-time
   */
  modified?: string;
  /**
   * Touched timestamp
   * @format date-time
   */
  touched?: string;
}

/** An asset owned by the applicant or co-applicant. */
export interface Asset {
  /** The category of asset */
  assetCategory?: AssetAssetCategoryEnum;
  /** Free text description of the asset */
  description?: string;
  /** Estimated value of the asset */
  value?: number;
  /** Type of real estate property */
  propertyType?: AssetPropertyTypeEnum;
  /**
   * Year the property was purchased (REAL_ESTATE only — the form asks for a year, not a full date, for property). Vehicles carry purchaseDate instead.
   * @format int32
   */
  purchaseYear?: number;
  /** Price paid when the asset was purchased */
  purchasePrice?: number;
  /**
   * Name of the company asset
   * @minLength 0
   * @maxLength 255
   */
  companyName?: string;
  /** Total sum of the company's assets */
  companyAssetSum?: number;
  /** Type of vehicle */
  vehicleType?: AssetVehicleTypeEnum;
  /**
   * Vehicle registration number
   * @minLength 0
   * @maxLength 16
   */
  registrationNumber?: string;
  /**
   * The date the vehicle was purchased (VEHICLE only — the form asks for a full date here). Property carries purchaseYear instead.
   * @format date
   */
  purchaseDate?: string;
}

/** A child included in the financial assistance application. */
export interface Child {
  /**
   * Party id (personId GUID) of the child
   * @minLength 0
   * @maxLength 36
   */
  partyId?: string;
  /**
   * First name
   * @minLength 0
   * @maxLength 100
   */
  firstName?: string;
  /**
   * Last name
   * @minLength 0
   * @maxLength 100
   */
  lastName?: string;
  /**
   * Name of the child's school
   * @minLength 0
   * @maxLength 255
   */
  schoolName?: string;
  /** Extent of residence in the home */
  residenceExtent?: ChildResidenceExtentEnum;
  /**
   * Number of days per month the child lives in the home
   * @format int32
   */
  daysInHome?: number;
}

/** A cost the applicant is applying for assistance with. */
export interface Cost {
  /** The type of cost */
  costType?: CostCostTypeEnum;
  /** The amount applied for */
  appliedAmount?: number;
  /** Sub type when the cost type is OTHER */
  otherSubType?: CostOtherSubTypeEnum;
  /** Free text specification of the cost */
  specification?: string;
  /** Recipient of the cost or the period it covers */
  recipientOrPeriod?: string;
}

/** Request to create a financial assistance errand. */
export interface CreateFinancialAssistanceRequest {
  /** Title of the errand */
  title?: string;
  /** Description of the errand */
  description?: string;
  /** Priority of the errand */
  priority?: string;
  /** Id of the reporting user */
  reporterUserId?: string;
  /** Id of the assigned user */
  assignedUserId?: string;
  /** The typed financial assistance application payload */
  data?: FinancialAssistanceData;
}

/** The typed financial assistance application payload. */
export interface FinancialAssistanceData {
  /** The type of application */
  applicationType?: FinancialAssistanceDataApplicationTypeEnum;
  /** Marital status of the applicant */
  maritalStatus?: FinancialAssistanceDataMaritalStatusEnum;
  /**
   * The month the application period concerns
   * @format int32
   */
  periodMonth?: number;
  /**
   * The year the application period concerns
   * @format int32
   */
  periodYear?: number;
  /** Choice of application period */
  periodChoice?: FinancialAssistanceDataPeriodChoiceEnum;
  normType?: FinancialAssistanceDataNormTypeEnum[];
  /** Description of the other benefit */
  otherBenefitDescription?: string;
  /** Description of the applicant's livelihood */
  livelihoodDescription?: string;
  /** Whether the household has children under 21 */
  hasChildrenUnder21?: boolean;
  /** Whether the children's residence situation has changed */
  childrenResidenceChanged?: boolean;
  /** Description of the change in children's residence */
  childrenResidenceChangeDescription?: string;
  /** The household's housing form */
  housingForm?: FinancialAssistanceDataHousingFormEnum;
  /**
   * Total number of persons (adults and children) living in the housing
   * @format int32
   */
  housingPersonCount?: number;
  /**
   * Number of rooms plus kitchen
   * @format int32
   */
  housingRoomsPlusKitchen?: number;
  /** Free text description of the housing */
  housingDescription?: string;
  /** Whether the housing situation has changed */
  housingChanged?: boolean;
  /** Description of the housing change */
  housingChangeDescription?: string;
  /** Whether the household has incomes */
  hasIncomes?: boolean;
  /** Whether the household has pending benefits */
  hasPendingBenefits?: boolean;
  /** Whether the household has assets */
  hasAssets?: boolean;
  /** Whether the applicant stays in the municipality */
  staysInMunicipality?: boolean;
  /** Description of the applicant's stay */
  stayDescription?: string;
  /** Whether the applicant has attested the application */
  attestation?: boolean;
  /**
   * When the application was attested
   * @format date-time
   */
  attestedAt?: string;
  /** Children included in the application */
  children?: Child[];
  /** Costs applied for */
  costs?: Cost[];
  /** Incomes reported */
  incomes?: Income[];
  /** Pending benefits */
  pendingBenefits?: PendingBenefit[];
  /** Assets owned */
  assets?: Asset[];
  /** Persons on the application */
  persons?: Person[];
  /** Plannings towards self-sufficiency */
  plannings?: Planning[];
  /** Planned activities */
  plannedActivities?: PlannedActivity[];
  /** Job applications */
  jobApplications?: JobApplication[];
}

/** An income reported by the applicant or co-applicant. */
export interface Income {
  /** The type of income */
  incomeType?: IncomeIncomeTypeEnum;
  /** The income amount */
  amount?: number;
  /**
   * The date the income was received
   * @format date
   */
  incomeDate?: string;
  /** Who received the income */
  recipient?: IncomeRecipientEnum;
}

/** A job application reported by the applicant or co-applicant. */
export interface JobApplication {
  /** Which person submitted the job application */
  person?: string;
  /**
   * The date the job application was submitted
   * @format date
   */
  applicationDate?: string;
  /**
   * The job title applied for
   * @minLength 0
   * @maxLength 255
   */
  jobTitle?: string;
  /**
   * Employer and place of work
   * @minLength 0
   * @maxLength 255
   */
  employerAndPlace?: string;
}

/** A benefit the applicant has applied for but not yet received a decision on. */
export interface PendingBenefit {
  /**
   * Name of the pending benefit
   * @minLength 0
   * @maxLength 255
   */
  benefitName?: string;
  /**
   * Name of the person who applied for the benefit
   * @minLength 0
   * @maxLength 255
   */
  applicantName?: string;
}

/** A person (applicant or co-applicant) on the financial assistance application. */
export interface Person {
  /** Role of the person */
  role?: PersonRoleEnum;
  /**
   * Party id (personId GUID) of the person
   * @minLength 0
   * @maxLength 36
   */
  partyId?: string;
  /** Whether the person needs an interpreter */
  needsInterpreter?: boolean;
  /**
   * Language the interpreter should use
   * @minLength 0
   * @maxLength 64
   */
  interpreterLanguage?: string;
  /** Whether the person had work during the last 12 months */
  hadWorkLast12Months?: boolean;
  /** Description of the work the person had */
  hadWorkDescription?: string;
  /** Payment method */
  paymentMethod?: PersonPaymentMethodEnum;
  /**
   * Clearing number of the bank account
   * @minLength 0
   * @maxLength 16
   */
  clearingNumber?: string;
  /**
   * Bank account number
   * @minLength 0
   * @maxLength 32
   */
  accountNumber?: string;
  /** Description of the payment method when OTHER */
  otherPaymentDescription?: string;
  /** Whether the payment details are the same as previously used */
  paymentSameAsPrevious?: boolean;
  /**
   * Email address used for notifications about the application
   * @minLength 0
   * @maxLength 128
   */
  email?: string;
  /**
   * Phone number used for SMS notifications about the application
   * @minLength 0
   * @maxLength 32
   */
  phone?: string;
  /** Whether the person wants notifications about the application by email */
  notifyByEmail?: boolean;
  /** Whether the person wants notifications about the application by SMS */
  notifyBySms?: boolean;
}

/** A planned activity for the applicant or co-applicant. */
export interface PlannedActivity {
  /** Which person the activity concerns */
  person?: string;
  /** Description of the activity */
  activity?: string;
  /**
   * Period from date
   * @format date
   */
  periodFrom?: string;
  /**
   * Period to date
   * @format date
   */
  periodTo?: string;
}

/** The applicant's or co-applicant's planning towards self-sufficiency. */
export interface Planning {
  /** Which person the planning concerns */
  person?: PlanningPersonEnum;
  /** The type of planning */
  planningType?: PlanningPlanningTypeEnum;
  /** Extent of work */
  workExtent?: PlanningWorkExtentEnum;
  /** Description of the work */
  workDescription?: string;
  /** Level of sick leave (percent) */
  sickLeaveLevel?: PlanningSickLeaveLevelEnum;
  /**
   * First day of the sick-leave period stated on the medical certificate
   * @format date
   */
  sickLeaveFrom?: string;
  /**
   * Last day of the sick-leave period stated on the medical certificate
   * @format date
   */
  sickLeaveTo?: string;
  /** SFI study path */
  sfiStudyPath?: PlanningSfiStudyPathEnum;
  /** SFI course */
  sfiCourse?: PlanningSfiCourseEnum;
  /** Description of other planning */
  otherDescription?: string;
}

/** ContactChannel model */
export interface ContactChannel {
  /**
   * The key of the contact channel
   * @minLength 0
   * @maxLength 64
   */
  key?: string;
  /** The value of the contact channel */
  value?: string;
}

/** Stakeholder */
export interface Stakeholder {
  /** Unique identifier */
  id?: string;
  /**
   * External id for the stakeholder
   * @minLength 0
   * @maxLength 255
   */
  externalId?: string;
  /**
   * Type of external id
   * @minLength 0
   * @maxLength 32
   */
  externalIdType?: string;
  /** Role of the stakeholder on the errand */
  role?: string;
  /**
   * First name
   * @minLength 0
   * @maxLength 100
   */
  firstName?: string;
  /**
   * Last name
   * @minLength 0
   * @maxLength 100
   */
  lastName?: string;
  /**
   * Organization name
   * @minLength 0
   * @maxLength 255
   */
  organizationName?: string;
  /**
   * Address
   * @minLength 0
   * @maxLength 255
   */
  address?: string;
  /**
   * Care of
   * @minLength 0
   * @maxLength 255
   */
  careOf?: string;
  /**
   * Zip code
   * @minLength 0
   * @maxLength 10
   */
  zipCode?: string;
  /**
   * City
   * @minLength 0
   * @maxLength 100
   */
  city?: string;
  /**
   * Country
   * @minLength 0
   * @maxLength 100
   */
  country?: string;
  /** Contact channels for the stakeholder */
  contactChannels?: ContactChannel[];
}

/** Request to enqueue a UiPath RPA task on an errand. */
export interface RpaTaskRequest {
  /**
   * The RPA action — selects the Lifecare flow the robot runs
   * @minLength 1
   */
  action: RpaTaskRequestActionEnum;
  /** Optional extra hints for the robot, merged into the queue item SpecificContent. For REGISTER_PAYMENT, carries only the key 'paymentId' (the payment's id on the errand) — the robot fetches everything else via GET .../payments/{paymentId}, instead of putting payee names, account numbers or other personal data on the Orchestrator queue, the same reason RpaContext is fetched per queue item rather than riding along in it. */
  parameters?: Record<string, string>;
}

/** A referral/consultation on an errand, with the receiving authority, due date and status. */
export interface Referral {
  /** Unique id */
  id?: string;
  /**
   * The receiving authority (namespace-defined)
   * @minLength 0
   * @maxLength 64
   */
  authority?: string;
  /**
   * Recipient (name/unit)
   * @minLength 0
   * @maxLength 255
   */
  recipient?: string;
  /**
   * Date the referral was sent. Defaults to today when omitted.
   * @format date
   */
  sentAt?: string;
  /**
   * Response due date
   * @format date
   */
  dueAt?: string;
  /**
   * Response to the referral
   * @minLength 0
   * @maxLength 4096
   */
  responseText?: string;
  /** Status */
  status?: ReferralStatusEnum;
  /**
   * Created
   * @format date-time
   */
  created?: string;
  /**
   * Modified
   * @format date-time
   */
  modified?: string;
}

/** Response to a referral. */
export interface ReferralResponseRequest {
  /**
   * Response to the referral
   * @minLength 0
   * @maxLength 4096
   */
  responseText: string;
}

/** Request body for correlating a BPMN message to the process instance currently running for an errand. The errand id is used as the process business key, so the message is delivered to that specific process. Use this whenever something outside the process (a caseworker action, an external event, an admin override) needs to resume or interact with a running process instance. */
export interface ProcessMessageRequest {
  /**
   * BPMN message name, matching the `name` attribute on the `<bpmn:message>` element the receive task references
   * @minLength 1
   */
  messageName: string;
  /** Process variables to set when correlating the message */
  variables?: Record<string, any>;
}

/** An issued permit with a validity period, conditions and status. */
export interface Permit {
  /** Unique id */
  id?: string;
  /**
   * The type of permit (namespace-defined)
   * @minLength 0
   * @maxLength 64
   */
  permitType?: string;
  /**
   * Valid from (decision date). Defaults to today when omitted.
   * @format date
   */
  validFrom?: string;
  /**
   * Valid until and including. Open-ended when omitted.
   * @format date
   */
  validUntil?: string;
  /**
   * Conditions for the permit
   * @minLength 0
   * @maxLength 4096
   */
  conditions?: string;
  /** Status */
  status?: PermitStatusEnum;
  /**
   * Created
   * @format date-time
   */
  created?: string;
  /**
   * Modified
   * @format date-time
   */
  modified?: string;
}

/** User-facing notification raised against an errand. Mutable: callers acknowledge (acknowledged=true) when the recipient has seen it; expired notifications are purged by a background job. */
export interface Notification {
  /** Unique identifier */
  id?: string;
  /** Id of the errand the notification belongs to (server-assigned from path) */
  errandId?: string;
  /**
   * User id of the recipient (the user who should see this notification)
   * @minLength 0
   * @maxLength 64
   */
  ownerId?: string;
  /**
   * User or system id that produced the notification. Automatically acknowledged if equal to ownerId.
   * @minLength 0
   * @maxLength 64
   */
  createdBy?: string;
  /** Notification type */
  type?: NotificationTypeEnum;
  /** Swedish display name for the notification type */
  typeDisplayName?: string;
  /** Notification sub-type */
  subType?: NotificationSubTypeEnum;
  /** Swedish display name for the notification sub-type */
  subTypeDisplayName?: string;
  /** Short human-readable description */
  description?: string;
  /** Optional longer content / body */
  content?: string;
  /** Acknowledgement state. On PATCH, null leaves the value unchanged; true/false sets it. The bulk-acknowledge endpoint flips this to true for every notification on an errand. */
  acknowledged?: boolean;
  /**
   * Timestamp after which the notification is eligible for cleanup (server-assigned)
   * @format date-time
   */
  expires?: string;
  /**
   * Creation timestamp (server-assigned)
   * @format date-time
   */
  created?: string;
  /**
   * Last-modified timestamp (server-assigned)
   * @format date-time
   */
  modified?: string;
}

export interface CreateNote {
  /**
   * @minLength 0
   * @maxLength 8192
   */
  body: string;
  /**
   * @minLength 0
   * @maxLength 64
   */
  author?: string;
}

/** A new message in the errand's conversation */
export interface CreateMessage {
  /**
   * Direction: OUTBOUND = caseworker → applicant, INBOUND = applicant → caseworker
   * @minLength 1
   */
  direction: CreateMessageDirectionEnum;
  /**
   * Message text
   * @minLength 0
   * @maxLength 8192
   */
  body: string;
  /**
   * Author id (the caseworker's user id or the applicant's identifier)
   * @minLength 0
   * @maxLength 64
   */
  author?: string;
  /** Id of the message this one replies to. Optional; when set it must reference a message on the same errand. */
  inReplyToId?: string;
}

/** The messages the caller has read, to be marked as read for the calling side */
export interface MarkMessagesRead {
  /**
   * Ids of the read messages. Must reference messages on the same errand.
   * @minItems 1
   */
  messageIds: string[];
}

export interface CreateJournalEntry {
  /**
   * Journal entry type (Lifecare 'Typ'/Journaltyp)
   * @minLength 0
   * @maxLength 255
   */
  type: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @minLength 0
   * @maxLength 255
   */
  heading: string;
  /**
   * Free-text body of the journal entry; optional
   * @minLength 0
   * @maxLength 1048576
   */
  text?: string;
  /**
   * Documented date and time (Lifecare 'Datum'/'Tid')
   * @format date-time
   */
  entryDateTime: string;
  /**
   * User id of the author (Lifecare 'Upprättad av'); optional
   * @minLength 0
   * @maxLength 64
   */
  createdBy?: string;
}

export interface LockJournalEntry {
  /**
   * User id of whoever locks the entry; optional
   * @minLength 0
   * @maxLength 64
   */
  lockedBy?: string;
}

/** A journalanteckning (case-journal entry) attached to an errand */
export interface JournalEntry {
  /** Unique identifier */
  id?: string;
  /** Errand id this journal entry belongs to */
  errandId?: string;
  /** Provenance — CASEWORKER for a journal entry authored in Draken, LIFECARE for one read out of Lifecare by RPA and mirrored onto the errand */
  source?: string;
  /** The journal entry's id in Lifecare's document list — set on LIFECARE-sourced mirrors (the RPA upsert key) */
  lifecareId?: string;
  /** Journal entry type (Lifecare 'Typ'/Journaltyp). A municipality-configured value; see the metadata catalogue for a provisional set. */
  type?: string;
  /** Heading (Lifecare 'Rubrik') */
  heading?: string;
  /** Free-text body of the journal entry */
  text?: string;
  /**
   * Documented date and time (Lifecare 'Datum'/'Tid'), distinct from the system created timestamp
   * @format date-time
   */
  entryDateTime?: string;
  /** Write-protection status — WORKING is an editable working note, LOCKED is a finalised record */
  status?: JournalEntryStatusEnum;
  /** User id of the author (Lifecare 'Upprättad av'/'Ägare') */
  createdBy?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /** User id of the last editor (Lifecare 'Ändrat av'); null until the entry has been edited */
  modifiedBy?: string;
  /**
   * Last modified timestamp; null until the entry has been edited
   * @format date-time
   */
  modified?: string;
  /** User id of whoever locked the entry; null while WORKING */
  lockedBy?: string;
  /**
   * Timestamp when the entry was locked (became an upprättad handling); null while WORKING
   * @format date-time
   */
  locked?: string;
}

export interface CreateDocument {
  /**
   * Document type (Lifecare 'Typ'/Dokumenttyp)
   * @minLength 0
   * @maxLength 255
   */
  type: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @minLength 0
   * @maxLength 255
   */
  heading: string;
  /**
   * Free-text body of the document; optional
   * @minLength 0
   * @maxLength 1048576
   */
  text?: string;
  /**
   * Documented date and time (Lifecare 'Datum'/'Tid')
   * @format date-time
   */
  documentDateTime: string;
  /**
   * User id of the author (Lifecare 'Upprättad av'); optional
   * @minLength 0
   * @maxLength 64
   */
  createdBy?: string;
}

export interface LockDocument {
  /**
   * User id of whoever locks the document; optional
   * @minLength 0
   * @maxLength 64
   */
  lockedBy?: string;
}

/** A document (formal case document) attached to an errand */
export interface Document {
  /** Unique identifier */
  id?: string;
  /** Errand id this document belongs to */
  errandId?: string;
  /** Provenance — CASEWORKER for a document authored in Draken, LIFECARE for one read out of Lifecare by RPA and mirrored onto the errand */
  source?: string;
  /** The document's id in Lifecare's document list — set on LIFECARE-sourced mirrors (the RPA upsert key) */
  lifecareId?: string;
  /** Document type (Lifecare 'Typ'/Dokumenttyp). A municipality-configured value; see the metadata catalogue for a provisional set. */
  type?: string;
  /** Heading (Lifecare 'Rubrik') */
  heading?: string;
  /** Free-text body of the document */
  text?: string;
  /**
   * Documented date and time (Lifecare 'Datum'/'Tid'), distinct from the system created timestamp
   * @format date-time
   */
  documentDateTime?: string;
  /** Write-protection status — WORKING is an editable draft, LOCKED is a finalised record */
  status?: DocumentStatusEnum;
  /** User id of the author (Lifecare 'Upprättad av'/'Ägare') */
  createdBy?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /** User id of the last editor (Lifecare 'Ändrat av'); null until the document has been edited */
  modifiedBy?: string;
  /**
   * Last modified timestamp; null until the document has been edited
   * @format date-time
   */
  modified?: string;
  /** User id of whoever locked the document; null while WORKING */
  lockedBy?: string;
  /**
   * Timestamp when the document was locked (became an upprättad handling); null while WORKING
   * @format date-time
   */
  locked?: string;
}

/** Decision recorded against an errand. Both system-generated decisions (e.g. a DMN-evaluated recommendation produced by a BPMN process) and human decisions (e.g. a caseworker approving a payment) are stored here, distinguished by `decisionType`. The list on the errand grows over time and is the audit trail of every decision made on the case. */
export interface Decision {
  /** Unique identifier */
  id?: string;
  /**
   * Decision category. Free-form string; conventionally `RECOMMENDATION` for DMN-produced suggestions and `PAYMENT` for caseworker APPROVE/REJECT decisions, but namespaces are encouraged to define their own.
   * @minLength 0
   * @maxLength 32
   */
  decisionType?: string;
  /**
   * Decision value. For binary outcomes use `APPROVED`/`REJECTED`; for richer outputs (e.g. a calculated amount) use the value itself or a short label.
   * @minLength 0
   * @maxLength 255
   */
  value?: string;
  /**
   * Optional human-readable description or motivation for the decision
   * @minLength 0
   * @maxLength 4096
   */
  description?: string;
  /** Optional decision amount, in SEK. For a financial-assistance decision this is the granted amount (0 for a rejection); for a recommendation it is the recommended amount when the pipeline has computed one. */
  amount?: number;
  /**
   * Optional decision message communicated to the applicant — the free-text justification shown on the decision letter, kept separate from the internal `description`.
   * @minLength 0
   * @maxLength 8192
   */
  decisionMessage?: string;
  /**
   * Optional date the decision applies (the caseworker-chosen decision date), distinct from the server-assigned `created` audit timestamp.
   * @format date
   */
  decisionDate?: string;
  /**
   * Optional start of the period the decision covers (the month applied for, for a financial-assistance decision).
   * @format date
   */
  periodFrom?: string;
  /**
   * Optional end of the period the decision covers.
   * @format date
   */
  periodTo?: string;
  /**
   * Identifier of the actor that produced the decision. Use the caseworker userId for human decisions or a system identifier (e.g. `operaton`, `dmn-engine`) for automated ones.
   * @minLength 0
   * @maxLength 64
   */
  createdBy?: string;
  /**
   * Timestamp the decision was recorded (server-assigned)
   * @format date-time
   */
  created?: string;
}

/** Request to create a financial assistance income warning on an errand (no Lifecare round-trip). */
export interface CreateWarningRequest {
  /**
   * The warning type
   * @minLength 1
   */
  type: CreateWarningRequestTypeEnum;
  /**
   * Human-readable warning text
   * @minLength 1
   */
  message: string;
  /**
   * A stable key for the income the warning concerns (benefit/incomeType) — the dedup key. Derived from the message when omitted.
   * @minLength 0
   * @maxLength 255
   */
  sourceKey?: string;
}

/** A financial assistance income warning the caseworker can acknowledge or close. */
export interface Warning {
  /** The warning id */
  id?: string;
  /** The warning type (machine code; use typeDisplayName for the label) */
  type?: WarningTypeEnum;
  /** Swedish display name for the warning type */
  typeDisplayName?: string;
  /** The Draken view section (tab) the warning belongs to — derived from the type: the decision proposal's types are DECISION, the payment proposal's are PAYMENT, everything else is CALCULATION */
  section?: WarningSectionEnum;
  /** A stable key for the income the warning concerns (benefit/incomeType) — the dedup key */
  sourceKey?: string;
  /** Human-readable warning text (Swedish) */
  message?: string;
  /** The warning status (machine code; use statusDisplayName for the label) */
  status?: WarningStatusEnum;
  /** Swedish display name for the warning status */
  statusDisplayName?: string;
  /** Whether the warning was closed automatically (its cause resolved) rather than by a caseworker */
  autoResolved?: boolean;
  /**
   * When the warning was created
   * @format date-time
   */
  created?: string;
  /**
   * When the warning was last updated
   * @format date-time
   */
  updated?: string;
}

/** One row from Lifecare's document list — journal notes (documentType 3) and regular documents (documentType 0) share this shape. */
export interface LifecareDocumentRow {
  /** The row's id in Lifecare's document list — the upsert key together with documentType. Rows without it are skipped. */
  id?: string;
  /** Title (Lifecare 'Rubrik'); becomes the mirrored heading */
  title?: string;
  /** Documented date (yyyy-MM-dd). Required — rows without a parseable date are reported FAILED. */
  date?: string;
  /** Documented time (HH:mm); optional, midnight when absent */
  time?: string;
  /** Type display text (Lifecare 'Typ'); becomes the mirrored type, falling back to typeCode */
  type?: string;
  /** Type code (Lifecare notes: 1 Journalanteckning; documents: e.g. 13 BE Brev, 14 BE Dokument) */
  typeCode?: string;
  /** Row discriminator: 3 = journal note, 0 = regular document. Other values are reported SKIPPED. */
  documentType?: string;
  /** Body as Lifecare returns it — HTML with entities. Decoded and stripped to plain text before storage. */
  content?: string;
  /** The signature of the last writer in Lifecare; becomes the mirrored author */
  updateSignature?: string;
  /** Lifecare's last-update date (yyyy-MM-dd, day precision only); informational */
  updateDate?: string;
  /** Lifecare's textual name for documentType; informational */
  documentType_Name?: string;
}

/** The jobbstimulans periods from Lifecare's GetJobStimulusForService — the applicant's and, when present, the co-applicant's. */
export interface LifecareJobStimulus {
  /** The applicant's period set */
  applicant?: LifecareJobStimulusParty;
  /** The co-applicant's period set; null or an empty object when there is no co-applicant */
  coApplicant?: LifecareJobStimulusParty;
}

/** One party's jobbstimulans periods. */
export interface LifecareJobStimulusParty {
  /** The party's periods */
  periods?: LifecareJobStimulusPeriod[];
}

/** One jobbstimulans period. Lifecare's unstable jobStimulusId is intentionally absent. */
export interface LifecareJobStimulusPeriod {
  /** Period start (yyyy-MM-dd). Required — periods without a parseable date are reported FAILED. */
  fromDate?: string;
  /** Period end (yyyy-MM-dd); optional */
  toDate?: string;
  /** Lifecare's removal flag — a period marked for removal is dropped on ingest */
  markedForRemoval?: boolean;
}

/** One bevakning row as Lifecare's ListRemindersByServiceId returns it. The stable reminderId is the upsert key. */
export interface LifecareReminder {
  /** Lifecare's stable reminder id — the idempotency key. Rows without it are skipped. */
  reminderId?: string;
  /** The monitoring date (yyyy-MM-dd). Required — rows without a parseable date are reported FAILED. */
  reminderDate?: string;
  /** Status code (Lifecare: 1 Pågår, 2 Klar, 3 Ej påbörjad, 4 Väntar — a snapshot, not a definition) */
  status?: string;
  /** Status display text; may be null */
  statusText?: string;
  /** Priority code (Lifecare: 1 Hög, 2 Normal, 3 Låg) */
  priority?: string;
  /** Priority display text; may be null */
  priorityText?: string;
  /** Reminder type code */
  type?: string;
  /** Reminder type display text; may be null */
  typeText?: string;
  /** The caseworker's free text */
  text?: string;
  /** The caseworker id in Lifecare */
  caseworkerId?: string;
  /** The caseworker's display name */
  caseworkerName?: string;
  /** What the reminder sits on (Lifecare: 7083 IFO.Insats, 7040 IFO.Aktualisering) */
  objectType?: string;
  /** Object type display name */
  objectTypeName?: string;
}

/** RPA supplements delivery envelope — a near-raw dump of the Lifecare Professional Web responses for the errand's client. An omitted section means 'not fetched this run'; an empty section means 'fetched, nothing there'. Unknown fields are ignored. */
export interface LifecareSupplements {
  /** The robot's capture date (day precision — Lifecare's own timestamps carry no more) */
  capturedAt?: string;
  /** Rows from Lifecare's ListRemindersByServiceId (bevakningar). Upserted as LIFECARE-sourced monitorings on the errand, keyed per reminderId. */
  reminders?: LifecareReminder[];
  /** Rows from Lifecare's document list — journal notes (documentType 3) and regular documents (documentType 0) alike. CareManagement routes each row on documentType; the robot does not need to tell them apart. */
  documents?: LifecareDocumentRow[];
  /** The response from Lifecare's GetJobStimulusForService. Replaces the errand's full jobbstimulans period set — Lifecare regenerates all period ids on every save, so ids are never used as keys. */
  jobStimulus?: LifecareJobStimulus;
}

/** Receipt for one delivered item in a supplements ingest. */
export interface SupplementsIngestOutcome {
  /** The envelope section the item came from */
  section?: SupplementsIngestOutcomeSectionEnum;
  /** The item's Lifecare id, when it has one */
  lifecareId?: string;
  /** What happened to the item */
  outcome?: SupplementsIngestOutcomeOutcomeEnum;
  /** Human-readable detail — the skip/failure reason, or a summary for REPLACED */
  detail?: string;
}

/** Receipt for a supplements ingest — one outcome per delivered item. */
export interface SupplementsIngestResult {
  /** One outcome per delivered item, in delivery order */
  results?: SupplementsIngestOutcome[];
}

/** The channels chosen for communicating the calculation and decision to the applicant. */
export interface CommunicationChannels {
  /** Send as a message in Mina sidor */
  minaSidor: boolean;
  /** Send to the applicant's digital mailbox (digital brevlåda) */
  digitalMailbox: boolean;
  /** Send as a physical letter */
  letter: boolean;
}

/** The caseworker's decision on the application — outcome, period, amount and what is communicated to the applicant. */
export interface FinalizeDecision {
  /** Decision outcome code. BIFALL/DELAVSLAG grant an amount (and require payments); AVSLAG/AVVISNING grant nothing. */
  outcome: FinalizeDecisionOutcomeEnum;
  /**
   * Internal motivation for the decision — stored as the decision's description, not shown to the applicant
   * @minLength 0
   * @maxLength 4096
   */
  reason?: string;
  /**
   * Start of the period the decision covers (the month applied for)
   * @format date
   */
  periodFrom?: string;
  /**
   * End of the period the decision covers
   * @format date
   */
  periodTo?: string;
  /**
   * The granted amount in SEK. Required when the outcome carries an amount (BIFALL/DELAVSLAG); ignored and recorded as 0 otherwise.
   * @min 0
   */
  amount?: number;
  /**
   * The underrättelse — the free-text decision message communicated to the applicant on the decision letter
   * @minLength 0
   * @maxLength 8192
   */
  decisionMessage?: string;
}

/** One payment to register in Lifecare for a granting decision. */
export interface FinalizePayment {
  /**
   * The date the payment is to be made
   * @format date
   */
  paymentDate: string;
  /**
   * The payment amount in SEK
   * @min 0
   */
  amount: number;
  /**
   * The month the payment concerns (ISO year-month, yyyy-MM) — the month the process polls Lifecare payments for
   * @pattern ^\d{4}-(0[1-9]|1[0-2])$
   */
  concernedMonth: string;
  /** Who the payment goes to and how */
  payee: Payee;
  /**
   * Optional accounting code (kontering) for the payment
   * @minLength 0
   * @maxLength 64
   */
  accountingCode?: string;
}

/** Finalize a financial assistance errand: record the decision, hand the Lifecare write-backs to RPA and resume the process. */
export interface FinalizeRequest {
  /** The decision */
  decision: FinalizeDecision;
  /** The channels chosen for sending the calculation and decision to the applicant */
  communication: CommunicationChannels;
  /** The payments to register in Lifecare. Required (at least one) when the outcome carries an amount; must be empty for AVSLAG/AVVISNING. */
  payments?: FinalizePayment[];
  /** Whether the caseworker changed the household size (gemensamma kostnader) in the calculation draft. When true the robot answers 'Ja' to Lifecare's prompt about saving the changed common costs when it writes the normberäkning. Defaults to false. */
  householdSizeChanged?: boolean;
}

/** The recipient of a payment and the payment method. */
export interface Payee {
  /**
   * Name of the payee as registered in Lifecare
   * @minLength 0
   * @maxLength 255
   */
  name: string;
  /**
   * The Lifecare payment method, e.g. bank account, bankgiro, plusgiro or utbetalningskort
   * @minLength 0
   * @maxLength 64
   */
  paymentMethod: string;
  /**
   * Clearing number, when the payment method needs one
   * @minLength 0
   * @maxLength 16
   */
  clearing?: string;
  /**
   * Account, bankgiro or plusgiro number, when the payment method needs one
   * @minLength 0
   * @maxLength 64
   */
  accountNumber?: string;
}

/** The receipt of a finalize — decision id, process correlation, RPA tasks and the communication channels to act on. */
export interface FinalizeResponse {
  /** Id of the PAYMENT decision recorded on the errand */
  decisionId?: string;
  /** The ids of the Payment rows the finalize created, in request order. The REGISTER_PAYMENT queue items carry these and nothing else - the robot reads each payment through GET .../payments/{paymentId}. */
  paymentIds?: string[];
  processMessageCorrelated?: boolean;
  /** The RPA write-back tasks the finalize step tried to enqueue, one per Lifecare step */
  rpaTasks?: RpaTask[];
  /** The communication channels chosen — the frontend sends the decision through these */
  communication?: CommunicationChannels;
}

/** One RPA write-back task the finalize step tried to enqueue. */
export interface RpaTask {
  /** The RPA action */
  action?: string;
  /** The queue item reference the Orchestrator knows the task by */
  reference?: string;
  /** Whether the task is on the queue (false when RPA is disabled or the enqueue failed) */
  enqueued?: boolean;
}

/** What a caseworker sends to add or patch a person row (identity + caseworker-writable fields only). */
export interface NormPersonInput {
  /**
   * The party id of the household member
   * @minLength 0
   * @maxLength 36
   */
  partyId?: string;
  /** The role of the household member */
  role?: NormPersonInputRoleEnum;
  /**
   * The name of the household member
   * @minLength 0
   * @maxLength 255
   */
  name?: string;
  /**
   * The number of days the caseworker decided
   * @format int32
   */
  caseworkerDays?: number;
  /** Whether the household member is included in the norm */
  included?: boolean;
  /**
   * The start date of the member's deviation from the household
   * @format date
   */
  deviationFromDate?: string;
  /**
   * The end date of the member's deviation from the household
   * @format date
   */
  deviationToDate?: string;
  /**
   * The norm interval applied to the member
   * @minLength 0
   * @maxLength 64
   */
  normInterval?: string;
  /** The job stimulus amount applied to the member */
  jobStimulusAmount?: number;
  /** Free-text note */
  note?: string;
}

/** One person row of the calculation draft (household member, process vs caseworker days). */
export interface NormPersonRow {
  /** The row id */
  id?: string;
  /** Who created the row: the process or a caseworker */
  origin?: NormPersonRowOriginEnum;
  /**
   * Stable 0-based position of the row within its section; assigned on creation and kept across refreshes so the row stays in place
   * @format int32
   */
  position?: number;
  /** The party id of the household member */
  partyId?: string;
  /** The role of the household member */
  role?: NormPersonRowRoleEnum;
  /** The name of the household member */
  name?: string;
  /**
   * The number of days in the home the process derived
   * @format int32
   */
  processDays?: number;
  /**
   * The number of days a caseworker decided; overrides the process value when set
   * @format int32
   */
  caseworkerDays?: number;
  /**
   * The number of days actually used (caseworker value when set, otherwise process value)
   * @format int32
   */
  effectiveDays?: number;
  /** Whether the household member is included in the norm */
  included?: boolean;
  /**
   * The start date of the member's deviation from the household
   * @format date
   */
  deviationFromDate?: string;
  /**
   * The end date of the member's deviation from the household
   * @format date
   */
  deviationToDate?: string;
  /** The norm interval applied to the member */
  normInterval?: string;
  /** The job stimulus amount applied to the member */
  jobStimulusAmount?: number;
  /** Whether the row is soft-deleted (excluded from the calculation, not resurrected by the daily refresh) */
  deleted?: boolean;
  /** Free-text note */
  note?: string;
  /**
   * When the row was created
   * @format date-time
   */
  created?: string;
  /**
   * When the row was last updated
   * @format date-time
   */
  updated?: string;
}

/** What a caseworker sends to add or patch an income row (identity + caseworker-writable fields only). */
export interface NormIncomeInput {
  /**
   * The FamilyCare income-type id
   * @format int32
   */
  typeId?: number;
  /**
   * The FamilyCare income-type name
   * @minLength 0
   * @maxLength 255
   */
  typeName?: string;
  /** The amount the caseworker decided for the applicant */
  applicantCaseworkerAmount?: number;
  /**
   * The date the applicant amount is attributed to
   * @format date-time
   */
  applicantAmountDate?: string;
  /** The amount the caseworker decided for the co-applicant */
  coapplicantCaseworkerAmount?: number;
  /**
   * The date the co-applicant amount is attributed to
   * @format date-time
   */
  coapplicantAmountDate?: string;
  /** Free-text note */
  note?: string;
}

/** One income row of the calculation draft (FamilyCare income type with applicant/co-applicant sides, process vs caseworker amounts). */
export interface NormIncomeRow {
  /** The row id */
  id?: string;
  /** Who created the row: the process or a caseworker */
  origin?: NormIncomeRowOriginEnum;
  /**
   * Stable 0-based position of the row within its section; assigned on creation and kept across refreshes so the row stays in place
   * @format int32
   */
  position?: number;
  /**
   * The FamilyCare income-type id
   * @format int32
   */
  typeId?: number;
  /** The FamilyCare income-type name */
  typeName?: string;
  /** The amount the process decided for the applicant (from the classified SSBTEK income) */
  applicantProcessAmount?: number;
  /** The amount a caseworker decided for the applicant; overrides the process amount when set */
  applicantCaseworkerAmount?: number;
  /** The amount actually used for the applicant (caseworker amount when set, otherwise process amount) */
  applicantEffectiveAmount?: number;
  /**
   * The date the applicant amount is attributed to
   * @format date-time
   */
  applicantAmountDate?: string;
  /** The amount the process decided for the co-applicant (from the classified SSBTEK income) */
  coapplicantProcessAmount?: number;
  /** The amount a caseworker decided for the co-applicant; overrides the process amount when set */
  coapplicantCaseworkerAmount?: number;
  /** The amount actually used for the co-applicant (caseworker amount when set, otherwise process amount) */
  coapplicantEffectiveAmount?: number;
  /**
   * The date the co-applicant amount is attributed to
   * @format date-time
   */
  coapplicantAmountDate?: string;
  /** Whether the row is soft-deleted (excluded from the calculation, not resurrected by the daily refresh) */
  deleted?: boolean;
  /** Free-text note */
  note?: string;
  /**
   * When the row was created
   * @format date-time
   */
  created?: string;
  /**
   * When the row was last updated
   * @format date-time
   */
  updated?: string;
}

/** What a caseworker sends to add or patch an expense row (identity + caseworker-writable fields only). */
export interface NormExpenseInput {
  /**
   * The cost type
   * @minLength 0
   * @maxLength 64
   */
  costType?: string;
  /** Which Lifecare bucket the expense posts to */
  bucket?: NormExpenseInputBucketEnum;
  /**
   * The other sub-type (when the cost type is 'other')
   * @minLength 0
   * @maxLength 32
   */
  otherSubType?: string;
  /** The cost specification */
  specification?: string;
  /** The amount applied for (ansökt). Honoured on both create and patch. */
  appliedAmount?: number;
  /** The amount the caseworker decided */
  caseworkerAmount?: number;
  /** Free-text note */
  note?: string;
}

/** One expense row of the calculation draft (applied cost, process vs caseworker amount). */
export interface NormExpenseRow {
  /** The row id */
  id?: string;
  /** Who created the row: the process or a caseworker */
  origin?: NormExpenseRowOriginEnum;
  /**
   * Stable 0-based position of the row within its section; assigned on creation and kept across refreshes so the row stays in place
   * @format int32
   */
  position?: number;
  /** Which Lifecare bucket the expense posts to */
  bucket?: NormExpenseRowBucketEnum;
  /** The cost type */
  costType?: string;
  /** The other sub-type (when the cost type is 'other') */
  otherSubType?: string;
  /** The cost specification */
  specification?: string;
  /** The amount the citizen applied for (ansökt); editable by a caseworker */
  appliedAmount?: number;
  /** The amount the rules allowed (the process amount) */
  processAmount?: number;
  /** The amount a caseworker decided; overrides the process amount when set */
  caseworkerAmount?: number;
  /** The amount actually used (caseworker amount when set, otherwise process amount) */
  effectiveAmount?: number;
  /** Whether the row is soft-deleted (excluded from the calculation, not resurrected by the daily refresh) */
  deleted?: boolean;
  /** Free-text note */
  note?: string;
  /**
   * When the row was created
   * @format date-time
   */
  created?: string;
  /**
   * When the row was last updated
   * @format date-time
   */
  updated?: string;
}

/** Request to read whether the Lifecare payment for an application month has been effectuated. */
export interface PaymentStatusRequest {
  /** The applicant's partyId (personId GUID) */
  applicant: string;
  /**
   * The application month (ISO year-month, yyyy-MM) the payment concerns
   * @pattern ^\d{4}-(0[1-9]|1[0-2])$
   */
  applicationMonth: string;
}

/** Whether the Lifecare payment for the application month has been effectuated. */
export interface PaymentStatusResponse {
  /** True when a Lifecare payment concerning the application month has been registered */
  effectuated?: boolean;
  /** The date the payment was made (Lifecare PayDate), when effectuated */
  paymentDate?: string;
}

/** Request to evaluate which financial assistance application a citizen should be offered. */
export interface EligibilityRequest {
  /** The applicant's partyId (personId GUID) */
  applicant: string;
  /** The co-applicant's (co-applicant) partyId (personId GUID), when applying together with a partner */
  coApplicant?: string;
}

/** A suggested application the citizen can submit, with its target period. */
export interface ApplicationSuggestion {
  /** The errand type slug to create the application against */
  typeSlug?: ApplicationSuggestionTypeSlugEnum;
  /** The application type the slug maps to */
  applicationType?: ApplicationSuggestionApplicationTypeEnum;
  /**
   * Month (1-12) the suggested application concerns. Null for a new application, which has no prior period.
   * @format int32
   */
  periodMonth?: number;
  /**
   * Year the suggested application concerns. Null for a new application.
   * @format int32
   */
  periodYear?: number;
  /** True for the primary suggestion the citizen should be guided towards */
  recommended?: boolean;
  /** Human-readable Swedish label for the suggestion */
  label?: string;
  /** Swedish explanation of when this application type applies, shown to the citizen next to the label. Null when no wording has been agreed for the type. */
  description?: string;
}

/** Eligibility result: which application(s) the citizen should be offered, plus the supporting facts. */
export interface EligibilityResponse {
  /** Suggested applications, ordered with the recommended one first. */
  suggestions?: ApplicationSuggestion[];
  /** Machine-readable code for the gate that drove the suggestion */
  reasonCode?: EligibilityResponseReasonCodeEnum;
  /** Human-readable Swedish explanation of the suggestion */
  message?: string;
  /** Swedish introduction shown to the citizen above the suggestion list, phrased for one or two applicants. Null when no application can be offered. */
  introText?: string;
  /** True when the applicant already has a financial assistance errand in caremanagement */
  existsInCm?: boolean;
  /** True when the applicant has a financial assistance footprint in Lifecare (actualisation/decision/calculation) */
  existsInLc?: boolean;
  /** True when Lifecare shows an actualisation with an open status, false when the statuses were readable but none is open, null when no actualisation carried a readable status (or Lifecare was not reached). */
  hasOpenCase?: boolean;
  /** Whether the requested marital status (alone vs with a partner) matches the previous application. Null when not evaluated (no existing case). */
  maritalStatusMatches?: boolean;
  /**
   * The staleness bound in days applied to ongoing caremanagement applications in the per-month check
   * @format int32
   */
  windowDays?: number;
  /** True when the current month is already taken — an ongoing application in caremanagement, or a decision in Lifecare */
  applicationExistsThisMonth?: boolean;
  /** True when next month is already taken — an ongoing application in caremanagement, or a decision in Lifecare */
  applicationExistsNextMonth?: boolean;
  /** True when Lifecare shows a decision for the current month (the current month is decided/closed) */
  currentMonthDecided?: boolean;
  /** True when Lifecare shows a decision for the previous month */
  previousMonthDecided?: boolean;
  /** True when Lifecare shows a decision for the month before the previous one */
  monthBeforePreviousDecided?: boolean;
  /**
   * Month (1-12) of the most recent Lifecare decision, when one exists
   * @format int32
   */
  latestDecisionPeriodMonth?: number;
  /**
   * Year of the most recent Lifecare decision, when one exists
   * @format int32
   */
  latestDecisionPeriodYear?: number;
  /** True when Lifecare shows a previous calculation */
  hasPreviousCalculation?: boolean;
  /** True when the Lifecare lookup succeeded. False means the answer is degraded (CM-only). */
  lifecareChecked?: boolean;
  /** True when the request included a co-applicant (co-applicant) */
  hasCoApplicant?: boolean;
  /** When reasonCode is RECENTLY_CLOSED: the id of the recently closed errand a caseworker can reopen (in Lifecare) and release. Null otherwise. */
  reopenableErrandId?: string;
  /**
   * When reasonCode is RECENTLY_CLOSED: when the reopenable errand was closed. Null otherwise.
   * @format date-time
   */
  closedAt?: string;
}

/** Request to build and post the SSBTEK-driven calculation for an application month. */
export interface CalculationRequest {
  /** The applicant's partyId (personId GUID) */
  applicant: string;
  /** The co-applicant's (co-applicant) partyId (personId GUID), when applying together with a partner */
  coApplicant?: string;
  /**
   * The application month (ISO year-month, yyyy-MM)
   * @pattern ^\d{4}-(0[1-9]|1[0-2])$
   */
  applicationMonth: string;
  /** The id of the caremanagement errand the calculation concerns — used to load the errand and, on the daily prepare, to record the Decision(RECOMMENDATION) the caseworker reviews. */
  errandId: string;
  /** The incomes classified by the operaton rules (the evaluate-income-rules worker output), as JSON. When present, caremanagement maps these to FamilyCare income rows instead of fetching SSBTEK and evaluating the raw list itself. */
  classifiedIncomes?: string;
  /** The unhandled-income warnings from the operaton rules, recorded on the errand recommendation */
  unhandledIncomes?: string[];
  /** The period-over-period change warnings from the operaton rules, recorded on the errand recommendation */
  changeWarnings?: string[];
  /** Whether SSBTEK could not be read for this run. True means the rules were deliberately not evaluated: the calculation is left exactly as it stands and the errand carries the read-failure warning until a later run succeeds. Absent is read as false, so a caller that does not know about the flag behaves as before. */
  ssbtekError?: boolean;
}

/** The created Lifecare calculation id plus the income warnings to review. */
export interface CalculationResponse {
  /**
   * The id of the calculation created in Lifecare FamilyCare
   * @format int32
   */
  calculationId?: number;
  /** SSBTEK incomes that could not be auto-transferred and must be reviewed */
  unhandledIncomes?: string[];
  /** Benefits whose net income changed beyond the threshold between the periods */
  changeWarnings?: string[];
  /** Whether this month's calculation covers every income type the previous month's did — false means SSBTEK data is still missing and the process should poll again */
  informationComplete?: boolean;
  /** Previous-month income types not yet present this month (the SSBTEK data still being awaited) */
  missingIncomeTypes?: string[];
}

/** Optional metadata for archiving a document to a Lifecare actualisation. */
export interface ArchiveActualisationRequest {
  /** The id of the caremanagement errand the archive concerns. When present, the target actualisation id is recorded on the errand as a Decision(ACTUALISATION) — setting the errand's Lifecare actualisation to the one archived to. */
  errandId?: string;
  /** The document title shown in Lifecare. Defaults to the uploaded file name when omitted. */
  title?: string;
  /** The Lifecare InsertDocumentType code for the document. Server default when omitted. */
  documentType?: string;
  /** The Lifecare InsertDocumentSenderType code for the document. Server default when omitted. */
  documentSenderType?: string;
  /** The sender name shown in Lifecare. Server default when omitted. */
  senderName?: string;
}

/** Request to create the Lifecare actualisation (case intake) for an application month. */
export interface ActualisationRequest {
  /** The applicant's partyId (personId GUID) */
  applicant: string;
  /**
   * The application month (ISO year-month, yyyy-MM); the actualisation's intake date is the first day of this month
   * @pattern ^\d{4}-(0[1-9]|1[0-2])$
   */
  applicationMonth: string;
  /** The id of the caremanagement errand the actualisation concerns. When present, a Decision(ACTUALISATION) recording the created Lifecare actualisation id is added to the errand's audit trail; when omitted, the actualisation is created without recording anything on an errand. */
  errandId?: string;
}

/** The created Lifecare actualisation id. */
export interface ActualisationResponse {
  /**
   * The id of the actualisation created in Lifecare FamilyCare
   * @format int32
   */
  actualisationId?: number;
}

/** PatchErrand model — patchable envelope fields only */
export interface PatchErrand {
  /**
   * Title for the errand
   * @minLength 0
   * @maxLength 255
   */
  title?: string;
  /**
   * Status of the errand
   * @minLength 0
   * @maxLength 64
   */
  status?: string;
  /** Description of the errand */
  description?: string;
  /**
   * Priority of the errand
   * @minLength 0
   * @maxLength 16
   */
  priority?: string;
  /**
   * User id of the reporter
   * @minLength 0
   * @maxLength 64
   */
  reporterUserId?: string;
  /**
   * User id of the assignee
   * @minLength 0
   * @maxLength 64
   */
  assignedUserId?: string;
}

export interface UpdateNote {
  /**
   * @minLength 0
   * @maxLength 8192
   */
  body: string;
  /**
   * @minLength 0
   * @maxLength 64
   */
  modifiedBy?: string;
}

/** Note attached to an errand */
export interface Note {
  /** Unique identifier */
  id?: string;
  /** Errand id this note belongs to */
  errandId?: string;
  /** Note body */
  body?: string;
  /** Author user id */
  author?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /** User id of the last editor */
  modifiedBy?: string;
  /**
   * Last modified timestamp; null until the note has been edited
   * @format date-time
   */
  modified?: string;
}

export interface UpdateJournalEntry {
  /**
   * Journal entry type (Lifecare 'Typ'/Journaltyp)
   * @minLength 0
   * @maxLength 255
   */
  type: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @minLength 0
   * @maxLength 255
   */
  heading: string;
  /**
   * Free-text body of the journal entry; optional
   * @minLength 0
   * @maxLength 1048576
   */
  text?: string;
  /**
   * Documented date and time (Lifecare 'Datum'/'Tid')
   * @format date-time
   */
  entryDateTime: string;
  /**
   * User id of the editor (Lifecare 'Ändrat av'); optional
   * @minLength 0
   * @maxLength 64
   */
  modifiedBy?: string;
}

export interface UpdateDocument {
  /**
   * Document type (Lifecare 'Typ'/Dokumenttyp)
   * @minLength 0
   * @maxLength 255
   */
  type: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @minLength 0
   * @maxLength 255
   */
  heading: string;
  /**
   * Free-text body of the document; optional
   * @minLength 0
   * @maxLength 1048576
   */
  text?: string;
  /**
   * Documented date and time (Lifecare 'Datum'/'Tid')
   * @format date-time
   */
  documentDateTime: string;
  /**
   * User id of the editor (Lifecare 'Ändrat av'); optional
   * @minLength 0
   * @maxLength 64
   */
  modifiedBy?: string;
}

/** Set the approval state of a financial assistance view section. */
export interface SectionApprovalRequest {
  /** Whether the section is approved (true) or its approval withdrawn (false) */
  approved: boolean;
}

/** A caseworker's approval of one section of the financial assistance view (calculation / payment / decision). */
export interface SectionApproval {
  /** The section this approval concerns */
  section?: SectionApprovalSectionEnum;
  /** Whether the section has been verified as approved by a caseworker */
  approved?: boolean;
  /** The caseworker who approved the section (null while not approved) */
  approvedBy?: string;
  /**
   * When the section was approved (null while not approved)
   * @format date-time
   */
  approvedAt?: string;
}

/** Caseworker edit of the calculation header — norm, calculation dates and custom household size. */
export interface NormHeaderInput {
  /**
   * The selected FamilyCare norm id (Norm)
   * @format int32
   */
  normId?: number;
  normType?: NormHeaderInputNormTypeEnum[];
  /**
   * Calculation period start (from)
   * @format date
   */
  calculationFromDate?: string;
  /**
   * Calculation period end (to)
   * @format date
   */
  calculationToDate?: string;
  /**
   * Calculation date (calculation date)
   * @format date
   */
  calculationDate?: string;
  /** Whether a custom household size is used */
  hasCustomHouseholdSize?: boolean;
  /**
   * The custom household size
   * @format int32
   */
  householdSize?: number;
}

/** The full draft calculation — header, the three sections (persons, incomes, expenses) and the section sums. */
export interface CalculationDraft {
  /** The errand id */
  errandId?: string;
  /** The application month (ISO yyyy-MM) */
  applicationMonth?: string;
  /**
   * The selected norm id
   * @format int32
   */
  normId?: number;
  /** The selected norm types */
  normType?: string[];
  /**
   * The start date of the calculation period
   * @format date
   */
  calculationFromDate?: string;
  /**
   * The end date of the calculation period
   * @format date
   */
  calculationToDate?: string;
  /**
   * The date the calculation is performed
   * @format date
   */
  calculationDate?: string;
  /** Whether the household size has been overridden by a caseworker */
  hasCustomHouseholdSize?: boolean;
  /**
   * The household size used for the norm
   * @format int32
   */
  householdSize?: number;
  /** The person rows (persons) */
  persons?: NormPersonRow[];
  /** The income rows (incomes) */
  incomes?: NormIncomeRow[];
  /** The expense rows (expenses) */
  expenses?: NormExpenseRow[];
  /** The special expense rows */
  specialExpenses?: NormExpenseRow[];
  /** The sum of the effective income amounts */
  incomeSum?: number;
  /** The sum of the effective expense amounts */
  expenseSum?: number;
  /** The sum of the effective special expense amounts */
  specialExpenseSum?: number;
  /**
   * When the draft was created
   * @format date-time
   */
  created?: string;
  /**
   * When the draft was last updated
   * @format date-time
   */
  updated?: string;
}

/** Number of errands assigned to a given user */
export interface AssigneeCount {
  /** The assigned user id */
  assignedUserId?: string;
  /**
   * Number of errands assigned to the user
   * @format int64
   */
  count?: number;
}

/** Aggregated errand statistics for the caseworker interface */
export interface StatisticsResponse {
  /**
   * Total number of errands in the selection
   * @format int64
   */
  total?: number;
  /** Number of errands per status */
  byStatus?: StatusCount[];
  /** Number of errands per assigned user */
  byAssignee?: AssigneeCount[];
  /**
   * Number of errands without an assigned user
   * @format int64
   */
  unassigned?: number;
}

/** Number of errands in a given status */
export interface StatusCount {
  /** Status */
  status?: string;
  /**
   * Number of errands in the status
   * @format int64
   */
  count?: number;
}

/** Paged errand response */
export interface FindErrandsResponse {
  errands?: Errand[];
  /** PagingAndSortingMetaData model */
  _meta?: PagingAndSortingMetaData;
}

/** PagingAndSortingMetaData model */
export interface PagingAndSortingMetaData {
  /**
   * Current page
   * @format int32
   */
  page?: number;
  /**
   * Displayed objects per page
   * @format int32
   */
  limit?: number;
  /**
   * Displayed objects on current page
   * @format int32
   */
  count?: number;
  /**
   * Total amount of hits based on provided search parameters
   * @format int64
   */
  totalRecords?: number;
  /**
   * Total amount of pages based on provided search parameters
   * @format int32
   */
  totalPages?: number;
  sortBy?: string[];
  /** The sort order direction */
  sortDirection?: Direction;
}

export interface StatusHistoryEntry {
  id?: string;
  errandId?: string;
  fromStatus?: string;
  toStatus?: string;
  changedBy?: string;
  /** @format date-time */
  changedAt?: string;
}

/** The number of notes on the errand */
export interface NoteCount {
  /**
   * Number of notes attached to the errand
   * @format int64
   */
  count?: number;
}

/** A message in the errand's conversation */
export interface Message {
  /** Unique identifier */
  id?: string;
  /** The errand the message belongs to */
  errandId?: string;
  /** Direction */
  direction?: MessageDirectionEnum;
  /** Message text */
  body?: string;
  /** Author id */
  author?: string;
  /** Id of the message this one replies to, when it is a reply (same errand) */
  inReplyToId?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /** Files attached to the message */
  attachments?: MessageAttachment[];
}

/** Metadata of a file attached to a message. Download the content via GET .../messages/{messageId}/attachments/{id}/file */
export interface MessageAttachment {
  /** Unique identifier */
  id?: string;
  /** File name */
  fileName?: string;
  /** Mime type */
  mimeType?: string;
  /**
   * File size in bytes
   * @format int32
   */
  fileSize?: number;
  /** Who sent the file, derived from the message direction: CLIENT (applicant, INBOUND) or CASEWORKER (caseworker, OUTBOUND) */
  senderRole?: MessageAttachmentSenderRoleEnum;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
}

/** The number of unread messages in the errand's conversation for the calling side */
export interface UnreadCount {
  /**
   * Number of messages addressed to the caller that the caller has not yet marked as read
   * @format int64
   */
  unreadCount?: number;
}

export interface ErrandEventEntry {
  id?: string;
  errandId?: string;
  municipalityId?: string;
  namespace?: string;
  source?: string;
  action?: string;
  target?: string;
  description?: string;
  httpMethod?: string;
  requestPath?: string;
  actor?: string;
  actorType?: string;
  requestId?: string;
  /** @format int32 */
  statusCode?: number;
  /** @format date-time */
  created?: string;
}

/** The number of activity events on the errand matching the given filters */
export interface ErrandEventCount {
  /**
   * Number of matching events
   * @format int64
   */
  count?: number;
}

/** Attachment model */
export interface Attachment {
  /** Unique identifier */
  id?: string;
  /** File name */
  fileName?: string;
  /** Mime type */
  mimeType?: string;
  /**
   * File size in bytes
   * @format int32
   */
  fileSize?: number;
  /** What kind of document this is: APPLICATION (citizen's application files), CONVERSATION (sent in a message thread), GENERATED (a consolidated PDF produced by the platform), ERRAND (uploaded directly to the errand), CASE_DATA (a case-data document for the errand), DECISION (a decision document for the errand) or MESSAGE_HISTORY (the archived conversation PDF for a closed errand) */
  documentType?: AttachmentDocumentTypeEnum;
  /** Who the file came from: CLIENT (applicant) or CASEWORKER (caseworker). May be null for files predating the distinction or with no clear sender. */
  senderRole?: AttachmentSenderRoleEnum;
  /** For CONVERSATION attachments, the id of the message the file is attached to — download it via .../messages/{messageId}/attachments/{id}/file. Null for non-conversation attachments, which download via .../attachments/{id}/file. */
  messageId?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * Modified timestamp
   * @format date-time
   */
  modified?: string;
}

/** Journal metadata — the provisional catalogue of selectable journal entry types. */
export interface JournalEntryMetadata {
  /** Selectable journal entry types */
  types?: JournalEntryType[];
}

/** A selectable journal entry type — the code and the Swedish Lifecare label. */
export interface JournalEntryType {
  /** The type code */
  code?: string;
  /** Human-readable Swedish label (the Lifecare 'Typ' value) */
  displayName?: string;
}

/** A financial assistance errand with its typed application payload. */
export interface FinancialAssistanceView {
  /** Unique id */
  id?: string;
  /** Errand number */
  errandNumber?: string;
  /** Municipality id */
  municipalityId?: string;
  /** Namespace */
  namespace?: string;
  /** Type slug */
  typeSlug?: string;
  /** Title of the errand */
  title?: string;
  /** Status of the errand */
  status?: string;
  /** Priority of the errand */
  priority?: string;
  /** Id of the reporting user */
  reporterUserId?: string;
  /** Id of the assigned user */
  assignedUserId?: string;
  /** Id of the started process instance */
  processInstanceId?: string;
  /**
   * Created
   * @format date-time
   */
  created?: string;
  /**
   * Modified
   * @format date-time
   */
  modified?: string;
  /**
   * Touched
   * @format date-time
   */
  touched?: string;
  /**
   * When the financial assistance process last ran its daily loop for this errand (the calculation /prepare step). Null until the first loop has run.
   * @format date-time
   */
  lastDailyRunAt?: string;
  /** The typed financial assistance application payload */
  data?: FinancialAssistanceData;
  /** The most recent automated recommendation on the errand (the latest RECOMMENDATION decision the caseworker reviews), or null when none has been produced. Carries the recommended value and, when the pipeline has computed it, the recommended amount/period to prefill the Decision form. */
  recommendation?: Decision;
  /** The caseworker approval state of the three financial assistance view sections (calculation, payment, decision) — whether each has been verified as approved. Always present with all three sections. */
  sectionApprovals?: SectionApprovals;
  /** The communication channels the caseworker chose when finalizing the errand (Besluta och utbetala), or null until then. The Draken BFF sends the decision through these; caremanagement only records the choice. */
  communication?: CommunicationChannels;
  /** Whether the caseworker changed the household size (gemensamma kostnader) when finalizing — forwarded to the RPA normberäkning write. Null until the errand has been finalized. */
  householdSizeChanged?: boolean;
}

/** The caseworker approval state of the three financial assistance view sections (calculation, payment, decision). */
export interface SectionApprovals {
  /** Approval of the calculation (calculation) section */
  calculation?: SectionApproval;
  /** Approval of the payment (payment) section */
  payment?: SectionApproval;
  /** Approval of the decision (decision) section */
  decision?: SectionApproval;
}

/** The number of active (OPEN/ACKNOWLEDGED) income warnings on the errand */
export interface WarningCount {
  /**
   * Number of active warnings — closed ones are not counted
   * @format int64
   */
  count?: number;
}

/** The context an RPA robot needs to act on an errand in Lifecare. Fetched per queue item so personal numbers never persist in the Orchestrator queue store; every read is recorded in the errand's event log. */
export interface RpaContext {
  /** The errand's human-readable number — what a person searches for in Draken */
  errandNumber?: string;
  /** The applicant's personal number (12 characters, may contain letters). Null when it could not be resolved — treat as an error on the robot side. */
  applicantPersonId?: string;
  /** The co-applicant's personal number; null when there is no co-applicant or it could not be resolved */
  coApplicantPersonId?: string;
}

/** The number of payments on the errand */
export interface PaymentCount {
  /**
   * Number of payments on the errand
   * @format int64
   */
  count?: number;
}

/** The payment proposal (utbetalningsförslag) — derived data, recomputed on every read. */
export interface PaymentProposal {
  /** The proposed payments — always exactly one entry from the service; the frontend may split it into several before registering */
  payments?: ProposedPayment[];
  /** Every distinct payee seen on the applicant's Lifecare payments in the last 12 months — the dropdown alternatives. FamilyCare has no payee register, so this is the only source */
  payeeOptions?: Payee[];
  /** Where the proposed payee came from: PREVIOUS_PAYMENT (the most recent Lifecare payment) or APPLICATION (the applicant stated a new account in the application, paymentSameAsPrevious=false). Null when no payee could be proposed */
  payeeSource?: PaymentProposalPayeeSourceEnum;
  /** The applicant's most recent Lifecare payment, or null when none was found (or Lifecare could not be read) */
  previousPayment?: PreviousPayment;
  /** Why the proposal is incomplete (Swedish), e.g. no norm is known so no amount could be estimated. Null when the proposal is complete */
  explanation?: string;
  /** The PAYMENT-section warnings this proposal raised (reconciled on every read) */
  warnings?: Warning[];
}

/** The applicant's most recent Lifecare payment. */
export interface PreviousPayment {
  /** The Lifecare pay date (raw Lifecare string) */
  payDate?: string;
  /** The paid amount */
  amount?: number;
  /** The month the payment concerned (raw Lifecare string) */
  concernedMonth?: string;
  /** The payment method as Lifecare names it */
  paymentMethod?: string;
  /** The payee name */
  name?: string;
  /** The clearing number, when a bank account */
  clearing?: string;
  /** The account number, when a bank account */
  accountNumber?: string;
  /** The payment message */
  message?: string;
}

/** One proposed payment (a proposal always starts with a single entry; the frontend may split it). */
export interface ProposedPayment {
  /**
   * The proposed payment date: the 27th of the concerned month, moved to the Friday before when the 27th is a Saturday (→ 26th) or Sunday (→ 25th). Swedish public holidays (röda dagar) are not considered — an open question with verksamheten
   * @format date
   */
  paymentDate?: string;
  /** The proposed amount — the whole estimated bistånd (see DecisionProposal.estimatedAmount). Null when no norm is known */
  amount?: number;
  /** The month the payment concerns (YYYY-MM) — the calculation's application month */
  concernedMonth?: string;
  /** The proposed payee, or null when neither a previous payment nor the application names one */
  payee?: Payee;
  /** Kontering. Always null for now: the FamilyCare API exposes no accounting code, so the caseworker fills it in. The field exists so the frontend can render and post it */
  accountingCode?: string | null;
}

/** The number of monitorings on the errand */
export interface MonitoringCount {
  /**
   * Number of monitorings on the errand
   * @format int64
   */
  count?: number;
}

/** A jobbstimulans period on the errand, mirrored out of Lifecare. */
export interface JobStimulusPeriod {
  /** Whose period it is */
  role?: JobStimulusPeriodRoleEnum;
  /**
   * Period start
   * @format date
   */
  fromDate?: string;
  /**
   * Period end; null for an open period
   * @format date
   */
  toDate?: string;
}

/** Self-describing snapshot of the form as it was rendered and answered. */
export interface FormSnapshot {
  /**
   * The snapshot envelope contract version (server-owned)
   * @minLength 1
   */
  schemaVersion: string;
  /** The frontend form / i18n bundle version that produced this snapshot */
  formDefinitionVersion?: string;
  /** The errand type slug the form belongs to */
  typeSlug?: string;
  /** The locale the form was rendered in */
  locale?: string;
  /**
   * When the form was rendered/submitted, per the client clock
   * @format date-time
   */
  capturedAt?: string;
  /** The form title the applicant saw */
  title?: string;
  /**
   * The sections of the form, in render order
   * @minItems 1
   */
  sections: FormSnapshotSection[];
  /** The attestation the applicant accepted, if any */
  attestation?: FormSnapshotAttestation;
}

/** The answer given to a field, as it was presented to the applicant. */
export interface FormSnapshotAnswer {
  /** The option code, when the answer is an enum/option value; null otherwise */
  code?: string;
  /** The raw value, when the answer is free text / number / boolean; null otherwise */
  value?: string;
  /** The human-readable answer text the applicant saw */
  display?: string;
}

/** The attestation the applicant accepted at submission. */
export interface FormSnapshotAttestation {
  /** The attestation text the applicant accepted */
  label?: string;
  /** The answer given to the attestation */
  answer?: FormSnapshotAnswer;
}

/** A single form field as it was rendered and answered. */
export interface FormSnapshotField {
  /** The field name (matches the typed application data field) */
  name?: string;
  /** The field label the applicant saw */
  label?: string;
  /** The input kind as rendered */
  inputType?: FormSnapshotFieldInputTypeEnum;
  /** The help text shown for the field, if any */
  helpText?: string;
  /** Info texts shown for the field, in order */
  infoTexts?: string[];
  /** Info / warning / error notices rendered for the field, in order */
  notices?: FormSnapshotNotice[];
  /** All options as presented (for RADIO/CHECKBOX/SELECT), in order */
  options?: FormSnapshotOption[];
  /** The answer given, when the field has a single answer */
  answer?: FormSnapshotAnswer;
  /** For REPEATING_GROUP fields, one entry per repeated instance */
  items?: FormSnapshotGroup[];
  /** Whether the field was required as rendered */
  required?: boolean;
  /** Whether the field was visible to the applicant */
  visible?: boolean;
  /** The visibility rule that was active, human-readable */
  condition?: string;
}

/** One repeated instance of a REPEATING_GROUP field — its nested fields, in render order. */
export interface FormSnapshotGroup {
  /** The nested fields for this repeated instance, in render order */
  fields?: FormSnapshotField[];
}

/** An info / warning / error notice shown to the applicant. */
export interface FormSnapshotNotice {
  /** The notice level */
  level?: FormSnapshotNoticeLevelEnum;
  /** The notice text the applicant saw */
  text?: string;
}

/** An option as presented to the applicant. */
export interface FormSnapshotOption {
  /** The option code (machine value) */
  code?: string;
  /** The option label the applicant saw */
  label?: string;
  /** Whether the applicant selected this option */
  selected?: boolean;
}

/** A section of the form as it was rendered. */
export interface FormSnapshotSection {
  /** A stable section id */
  id?: string;
  /** The section title the applicant saw */
  title?: string;
  /** The section-level description / info text, if any */
  description?: string;
  /** Whether the section was visible to the applicant */
  visible?: boolean;
  /** The fields in the section, in render order */
  fields?: FormSnapshotField[];
}

/** An allowed decision outcome (decision alternatives) for an errand type. */
export interface DecisionOption {
  /** The decision outcome code, stored on the Decision row's value */
  code?: string;
  /** Human-readable label for the outcome */
  displayName?: string;
  /** Whether the outcome carries an amount — true for outcomes that grant an amount, false for ones that imply 0 (e.g. a rejection) */
  carriesAmount?: boolean;
}

/** The decision proposal (beslutsförslag) — derived data, recomputed on every read. */
export interface DecisionProposal {
  /** The proposed decision outcome. Rule: estimatedAmount <= 0 → AVSLAG; estimatedAmount > 0 and every expense fully approved → BIFALL; estimatedAmount > 0 and any expense approved below the applied amount → DELAVSLAG. Null when no amount could be estimated (see explanation) */
  outcome?: DecisionProposalOutcomeEnum;
  /** Every outcome the caseworker can pick instead — the errand type's decision catalogue */
  outcomeOptions?: DecisionOption[];
  /**
   * The proposed decision period start — the calculation's period
   * @format date
   */
  periodFrom?: string;
  /**
   * The proposed decision period end — the calculation's period
   * @format date
   */
  periodTo?: string;
  /** The calculation's application month (YYYY-MM) */
  concernedMonth?: string;
  /** The estimated bistånd: normSum + expenseSum + specialExpenseSum − incomeSum, all from the calculation draft except the norm. The draft carries no norm sum, so it is taken from the applicant's most recent Lifecare calculation before the application month (previous household norm); the final amount is what Lifecare computes when the calculation is committed. Null when no previous norm is known (see explanation) */
  estimatedAmount?: number;
  /** The norm sum the estimate is based on (the previous Lifecare calculation's norm). Null when unknown */
  normSum?: number;
  /** The draft's income sum (effective amounts) */
  incomeSum?: number;
  /** The draft's expense sum (effective = approved amounts) */
  expenseSum?: number;
  /** The draft's special-expense sum (effective = approved amounts) */
  specialExpenseSum?: number;
  /** Why the proposal is incomplete (Swedish) — e.g. no previous norm could be read so no amount/outcome was proposed. Null when the proposal is complete */
  explanation?: string;
  /** The proposed orsak: the previous Lifecare decision's reason, or null when there is none */
  reason?: string;
  /** Every orsak the caseworker can pick instead — Lifecare's orsak-catalogue (försörjningshinder) in Lifecare's order, plus the previous decision's reason when that is not in the catalogue (FamilyCare exposes no reason catalogue over the API) */
  reasonOptions?: string[];
  /** The proposed frastext: on BIFALL/DELAVSLAG, "Bifall månad med barn" when children are in the calculation, else "Bifall månad utan barn". Null otherwise */
  phraseText?: string;
  /** The applicant's most recent Lifecare decision, or null when none was found (or Lifecare could not be read) */
  previousDecision?: PreviousDecision;
  /** The DECISION-section warnings this proposal raised (reconciled on every read) */
  warnings?: Warning[];
}

/** The applicant's most recent Lifecare decision. */
export interface PreviousDecision {
  /** The Lifecare decision type (free text as Lifecare names it) */
  type?: string;
  /** The Lifecare decision reason / orsak (free text) */
  reason?: string;
  /** The decision period start (raw Lifecare string) */
  periodFrom?: string;
  /** The decision period end (raw Lifecare string) */
  periodTo?: string;
  /** The decided amount */
  amount?: number;
  /** The decision date (raw Lifecare string) */
  date?: string;
}

/** A child pre-filled from Lifecare for a financial assistance renewal. Carries only what Lifecare provides — personnummer and name; the citizen completes residence, school etc. on the form. */
export interface PrefilledChild {
  /** Party id (personId GUID) of the child */
  partyId?: string;
  /** Name as registered in Lifecare */
  name?: string;
}

/** Pre-fill data for a financial assistance renewal (renewal): household children read from Lifecare. */
export interface RenewalPrefill {
  /** Children in the household from the most recent calculation */
  children?: PrefilledChild[];
  /** True when the Lifecare lookup succeeded. False means the answer is degraded (empty children). */
  lifecareChecked?: boolean;
}

/** Financial assistance type catalogue for the frontend dropdowns: income and cost types with labels, groups and the citizen flag. */
export interface FinancialAssistanceMetadata {
  /** The income types */
  incomeTypes?: TypeOption[];
  /** The cost types, grouped by their Mina-sidor form section */
  costTypes?: TypeOption[];
  /** The payment money types (Payment.moneyType allowed values). Placeholder — the real catalogue comes from Lifecare and isn't known yet. */
  moneyTypes?: TypeOption[];
  /** The payment methods (Payment.paymentMethod allowed values). Placeholder — the real catalogue comes from Lifecare and isn't known yet. */
  paymentMethods?: TypeOption[];
}

/** A selectable financial assistance income/cost type — the payload code plus its Mina-sidor + Lifecare labels, form group and citizen flag. */
export interface TypeOption {
  /** The type code, as stored on the payload (incomeType / costType) */
  code?: string;
  /** The citizen Mina-sidor label; null for caseworker-only types not on the citizen form */
  externalDisplayName?: string;
  /** The matching Lifecare caseworker dropdown label, or null when there is no Lifecare counterpart */
  internalDisplayName?: string;
  /** Stable code for the Mina-sidor form section the type is shown under; null for income */
  group?: TypeOptionGroupEnum;
  /** Whether the type is offered on the citizen Mina-sidor form */
  citizenReportable?: boolean;
}

/** A Lifecare document, metadata only. */
export interface LifecareDocument {
  /** The Lifecare document id */
  id?: string;
  /** The document title */
  title?: string;
  /** The document date as Lifecare reports it */
  date?: string;
  /** The document type */
  documentType?: string;
  /** The id of the entity the document belongs to */
  ownerId?: string;
  /** The type of the entity the document belongs to */
  ownerType?: string;
}

/** A Lifecare decision, full breakdown. */
export interface LifecareDecision {
  /**
   * The Lifecare decision id
   * @format int32
   */
  id?: number;
  /** The decision date as Lifecare reports it */
  date?: string;
  /** The decision type */
  type?: string;
  /** The start date of the decision period */
  fromDate?: string;
  /** The end date of the decision period */
  toDate?: string;
  /** The reason for the decision */
  reason?: string;
  /** The decision maker */
  decisionMaker?: string;
  /** The organization the decision belongs to */
  organization?: string;
  /** The decided amount */
  amount?: number;
  /** The co-applicant the decision covers, when any */
  coApplicant?: string;
  /** The reason concerning the co-applicant, when any */
  reasonCoApplicant?: string;
  persons?: LifecareDecisionPerson[];
}

/** A person on a Lifecare decision. */
export interface LifecareDecisionPerson {
  /** The Lifecare person id */
  personId?: string;
  /** The person name */
  name?: string;
  /** Whether the person is the co-applicant */
  coApplicant?: boolean;
}

/** A Lifecare calculation, full breakdown. */
export interface LifecareCalculation {
  /**
   * The Lifecare calculation id
   * @format int32
   */
  id?: number;
  /** The norm the calculation is based on */
  norm?: string;
  /** The start date of the calculation period */
  fromDate?: string;
  /** The end date of the calculation period */
  toDate?: string;
  /** The sum of all incomes */
  incomeSum?: number;
  /** The sum of all regular expenses */
  expenseSum?: number;
  /** The sum of all special expenses */
  specialExpenseSum?: number;
  /** The sum of the norm */
  normSum?: number;
  /** The common household cost */
  commonHouseholdCost?: number;
  /** The family cost */
  familyCost?: number;
  /** The balance of the calculation */
  balance?: number;
  /** The total sum of the calculation */
  totalSum?: number;
  /** Whether the calculation is final */
  isFinal?: boolean;
  persons?: LifecareCalculationPerson[];
  incomes?: LifecareCalculationIncome[];
  expenses?: LifecareCalculationExpense[];
  specialExpenses?: LifecareCalculationExpense[];
}

/** An expense row on a Lifecare calculation. */
export interface LifecareCalculationExpense {
  /** The expense type */
  type?: string;
  /** The applied amount */
  appliedAmount?: number;
  /** The approved amount */
  approvedAmount?: number;
}

/** An income row on a Lifecare calculation. */
export interface LifecareCalculationIncome {
  /** The income type */
  type?: string;
  /** The income amount for the applicant */
  amountApplicant?: number;
  /** The search date Lifecare used for the applicant */
  applicantSearchDate?: string;
  /** The income amount for the co-applicant */
  amountCoApplicant?: number;
  /** The search date Lifecare used for the co-applicant */
  coApplicantSearchDate?: string;
}

/** A household member on a Lifecare calculation. */
export interface LifecareCalculationPerson {
  /** The Lifecare person id */
  personId?: string;
  /** The person name */
  name?: string;
  /** The amount the person contributes to the norm */
  amount?: number;
  /** The start date of the deviation period, when any */
  deviationFromDate?: string;
  /** The end date of the deviation period, when any */
  deviationToDate?: string;
}

/** A Lifecare actualisation (case intake) registered on a person. */
export interface Actualisation {
  /**
   * The Lifecare actualisation id
   * @format int32
   */
  id?: number;
  /** The actualisation type */
  type?: string;
  /** The actualisation name */
  name?: string;
  /** The actualisation date as Lifecare reports it */
  date?: string;
  /** The reason for the actualisation */
  reason?: string;
  /** What the actualisation regards */
  regards?: string;
  /** Who the actualisation came from */
  fromWho?: string;
  /** The caseworker the actualisation is registered on */
  caseworker?: string;
  /** The organization the actualisation belongs to */
  organization?: string;
  /** The actualisation status */
  status?: string;
  /**
   * The linked investigation id, when any
   * @format int32
   */
  investigationId?: number;
  /**
   * The linked service id, when any
   * @format int32
   */
  serviceId?: number;
  /**
   * The linked decision id, when any
   * @format int32
   */
  decisionId?: number;
}

/** Document metadata — the catalogue of selectable document types. */
export interface DocumentMetadata {
  /** Selectable document types */
  types?: DocumentType[];
}

/** A selectable document type — the code and the Swedish Lifecare label. */
export interface DocumentType {
  /** The type code */
  code?: string;
  /** Human-readable Swedish label (the Lifecare 'Typ' value) */
  displayName?: string;
}

/** Count of errands matching the supplied filter */
export interface CountResponse {
  /**
   * Number of matching errands
   * @format int64
   */
  count?: number;
}

/** Form descriptor for an errand type slug — statuses, roles and the fields its data payload should carry. */
export interface ErrandTypeSchema {
  /** The errand type slug */
  typeSlug?: string;
  /** The application-type variant the slug maps to, when the type exposes one; null otherwise */
  applicationType?: string;
  /** Human-readable display name of the type */
  displayName?: string;
  /** Allowed statuses for the type — code plus human-readable display name, in lifecycle order */
  statuses?: StatusDefinition[];
  /** Stakeholder roles valid for the type */
  roles?: RoleDefinition[];
  /** The fields the type's data payload should carry, as form guidance */
  fields?: FieldDescriptor[];
  /** The allowed decision outcomes (decision alternatives) a caseworker may record on the type; empty when the type defines none */
  decisionOptions?: DecisionOption[];
}

/** Form-guidance descriptor for a single data field of an errand type. */
export interface FieldDescriptor {
  /** The data field name */
  name?: string;
  /** The field kind */
  type?: FieldDescriptorTypeEnum;
  /** True when the field is unconditionally required for the application types it applies to */
  required?: boolean;
  /** Allowable values when type is ENUM, otherwise null */
  options?: string[];
  /** For ARRAY fields, the OpenAPI component name of the element shape (resolve via /api-docs); null otherwise */
  itemsRef?: string;
  /** The application types that collect this field */
  appliesTo?: string[];
  /** Human-readable gate describing when the field is collected, when conditional; null when always collected */
  condition?: string;
  /** Short description of the field */
  description?: string;
}

export interface RoleDefinition {
  code?: string;
  displayName?: string;
  /** @format int32 */
  maxOccurrences?: number;
  required?: boolean;
}

/** An allowed status for an errand type — the stored code plus its human-readable label. */
export interface StatusDefinition {
  /** The status code stored on the errand */
  code?: string;
  /** Human-readable label for the status */
  displayName?: string;
}

/** Provenance, defaults to CASEWORKER when omitted. RPA POSTs LIFECARE (with lifecareId) to surface a payment read out of Lifecare onto the errand. */
export enum PaymentRequestSourceEnum {
  CASEWORKER = "CASEWORKER",
  LIFECARE = "LIFECARE",
}

/** Provenance: CASEWORKER for one authored in Draken, LIFECARE for one read out of Lifecare by RPA and surfaced here on the errand. */
export enum PaymentSourceEnum {
  CASEWORKER = "CASEWORKER",
  LIFECARE = "LIFECARE",
}

/** Server-managed lifecycle status. DRAFT on create; moves to QUEUED / EFFECTUATED / FAILED as the robot processes the REGISTER_PAYMENT RPA task. */
export enum PaymentStatusEnum {
  DRAFT = "DRAFT",
  QUEUED = "QUEUED",
  EFFECTUATED = "EFFECTUATED",
  FAILED = "FAILED",
}

/** Provenance, defaults to CASEWORKER when omitted. RPA POSTs LIFECARE (with lifecareId) to surface a monitoring read out of Lifecare onto the errand. */
export enum MonitoringRequestSourceEnum {
  CASEWORKER = "CASEWORKER",
  LIFECARE = "LIFECARE",
}

/** Provenance: CASEWORKER for one authored in Draken (RPA mirrors it onto the person in Lifecare), LIFECARE for one read out of Lifecare by RPA and surfaced here on the errand. */
export enum MonitoringSourceEnum {
  CASEWORKER = "CASEWORKER",
  LIFECARE = "LIFECARE",
}

/** The category of asset */
export enum AssetAssetCategoryEnum {
  BANK_SAVINGS = "BANK_SAVINGS",
  REAL_ESTATE = "REAL_ESTATE",
  COMPANY = "COMPANY",
  VEHICLE = "VEHICLE",
  OTHER = "OTHER",
}

/** Type of real estate property */
export enum AssetPropertyTypeEnum {
  CONDOMINIUM = "CONDOMINIUM",
  HOUSE = "HOUSE",
  PROPERTY = "PROPERTY",
  HOLIDAY_HOME = "HOLIDAY_HOME",
}

/** Type of vehicle */
export enum AssetVehicleTypeEnum {
  CAR = "CAR",
  BOAT = "BOAT",
  MOTORCYCLE = "MOTORCYCLE",
  CARAVAN = "CARAVAN",
  MOPED = "MOPED",
  SNOWMOBILE = "SNOWMOBILE",
  OTHER = "OTHER",
}

/** Extent of residence in the home */
export enum ChildResidenceExtentEnum {
  FULL_TIME = "FULL_TIME",
  HALF_TIME = "HALF_TIME",
  OTHER = "OTHER",
}

/** The type of cost */
export enum CostCostTypeEnum {
  RENT = "RENT",
  ELECTRICITY = "ELECTRICITY",
  HOME_INSURANCE = "HOME_INSURANCE",
  INTERNET = "INTERNET",
  UNEMPLOYMENT_FUND = "UNEMPLOYMENT_FUND",
  UNION_FEE = "UNION_FEE",
  TRAVEL_APPROVED = "TRAVEL_APPROVED",
  TRAVEL_MEDICAL_TRANSPORT = "TRAVEL_MEDICAL_TRANSPORT",
  MEDICAL_CARE = "MEDICAL_CARE",
  MEDICINE = "MEDICINE",
  OTHER = "OTHER",
}

/** Sub type when the cost type is OTHER */
export enum CostOtherSubTypeEnum {
  OTHER = "OTHER",
  MUNICIPAL_FEES = "MUNICIPAL_FEES",
  ACUTE_DENTAL = "ACUTE_DENTAL",
}

/** The type of application */
export enum FinancialAssistanceDataApplicationTypeEnum {
  NEW = "NEW",
  RENEWAL = "RENEWAL",
  SUPPLEMENTARY = "SUPPLEMENTARY",
}

/** Marital status of the applicant */
export enum FinancialAssistanceDataMaritalStatusEnum {
  SINGLE = "SINGLE",
  COHABITING = "COHABITING",
}

/** Choice of application period */
export enum FinancialAssistanceDataPeriodChoiceEnum {
  CURRENT_MONTH = "CURRENT_MONTH",
  NEXT_MONTH = "NEXT_MONTH",
  OTHER_BENEFIT = "OTHER_BENEFIT",
}

/** The norm types used for the calculation */
export enum FinancialAssistanceDataNormTypeEnum {
  NATIONAL_NORM = "NATIONAL_NORM",
  OTHER_NORM = "OTHER_NORM",
}

/** The household's housing form */
export enum FinancialAssistanceDataHousingFormEnum {
  NO_HOUSING_OR_INSTITUTION = "NO_HOUSING_OR_INSTITUTION",
  RENTAL = "RENTAL",
  SUBLET = "SUBLET",
  LODGER = "LODGER",
  CONDOMINIUM = "CONDOMINIUM",
  OWNED_HOUSE = "OWNED_HOUSE",
  RENTED_HOUSE = "RENTED_HOUSE",
  LIVING_WITH_PARENTS = "LIVING_WITH_PARENTS",
}

/** The type of income */
export enum IncomeIncomeTypeEnum {
  OTHER_INCOME = "OTHER_INCOME",
  FINANCIAL_AID_OTHER_MUNICIPALITY = "FINANCIAL_AID_OTHER_MUNICIPALITY",
  SALARY = "SALARY",
  SWISH_DEPOSITS = "SWISH_DEPOSITS",
  OCCUPATIONAL_PENSION_INSURANCE = "OCCUPATIONAL_PENSION_INSURANCE",
  CHILD_SUPPORT = "CHILD_SUPPORT",
  RENT_SHARE_FROM_CHILD = "RENT_SHARE_FROM_CHILD",
}

/** Who received the income */
export enum IncomeRecipientEnum {
  APPLICANT = "APPLICANT",
  CO_APPLICANT = "CO_APPLICANT",
}

/** Role of the person */
export enum PersonRoleEnum {
  APPLICANT = "APPLICANT",
  CO_APPLICANT = "CO_APPLICANT",
}

/** Payment method */
export enum PersonPaymentMethodEnum {
  BANK_ACCOUNT = "BANK_ACCOUNT",
  OTHER = "OTHER",
}

/** Which person the planning concerns */
export enum PlanningPersonEnum {
  APPLICANT = "APPLICANT",
  CO_APPLICANT = "CO_APPLICANT",
}

/** The type of planning */
export enum PlanningPlanningTypeEnum {
  WORK = "WORK",
  JOBSEEKING = "JOBSEEKING",
  SICK_LEAVE = "SICK_LEAVE",
  SFI = "SFI",
  OTHER = "OTHER",
}

/** Extent of work */
export enum PlanningWorkExtentEnum {
  FULL = "FULL",
  PART = "PART",
}

/** Level of sick leave (percent) */
export enum PlanningSickLeaveLevelEnum {
  Value100 = "100",
  Value75 = "75",
  Value50 = "50",
  Value25 = "25",
}

/** SFI study path */
export enum PlanningSfiStudyPathEnum {
  Value1 = "1",
  Value2 = "2",
  Value3 = "3",
}

/** SFI course */
export enum PlanningSfiCourseEnum {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
}

/**
 * The RPA action — selects the Lifecare flow the robot runs
 * @minLength 1
 */
export enum RpaTaskRequestActionEnum {
  FETCH_SUPPLEMENTS = "FETCH_SUPPLEMENTS",
  WRITE_NORMBERAKNING = "WRITE_NORMBERAKNING",
  WRITE_DECISION = "WRITE_DECISION",
  WRITE_JOURNAL = "WRITE_JOURNAL",
  WRITE_DOCUMENT = "WRITE_DOCUMENT",
  WRITE_MONITORING = "WRITE_MONITORING",
  REGISTER_PAYMENT = "REGISTER_PAYMENT",
}

/** Status */
export enum ReferralStatusEnum {
  SENT = "SENT",
  RESPONDED = "RESPONDED",
}

/** Status */
export enum PermitStatusEnum {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
}

/** Notification type */
export enum NotificationTypeEnum {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

/** Notification sub-type */
export enum NotificationSubTypeEnum {
  ERRAND = "ERRAND",
  DECISION = "DECISION",
  ATTACHMENT = "ATTACHMENT",
  STAKEHOLDER = "STAKEHOLDER",
  PARAMETER = "PARAMETER",
  MESSAGE = "MESSAGE",
  SYSTEM = "SYSTEM",
}

/**
 * Direction: OUTBOUND = caseworker → applicant, INBOUND = applicant → caseworker
 * @minLength 1
 */
export enum CreateMessageDirectionEnum {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

/** Write-protection status — WORKING is an editable working note, LOCKED is a finalised record */
export enum JournalEntryStatusEnum {
  WORKING = "WORKING",
  LOCKED = "LOCKED",
}

/** Write-protection status — WORKING is an editable draft, LOCKED is a finalised record */
export enum DocumentStatusEnum {
  WORKING = "WORKING",
  LOCKED = "LOCKED",
}

/**
 * The warning type
 * @minLength 1
 */
export enum CreateWarningRequestTypeEnum {
  UNHANDLED_INCOME = "UNHANDLED_INCOME",
  INCOME_CHANGE = "INCOME_CHANGE",
  MISSING_SSBTEK = "MISSING_SSBTEK",
  NEW_INCOME = "NEW_INCOME",
  NEW_EXPENSE = "NEW_EXPENSE",
  NEW_PERSON = "NEW_PERSON",
  INCOME_DROPPED = "INCOME_DROPPED",
  HOUSEHOLD_CHANGE = "HOUSEHOLD_CHANGE",
}

/** The warning type (machine code; use typeDisplayName for the label) */
export enum WarningTypeEnum {
  UNHANDLED_INCOME = "UNHANDLED_INCOME",
  INCOME_CHANGE = "INCOME_CHANGE",
  MISSING_SSBTEK = "MISSING_SSBTEK",
  NEW_INCOME = "NEW_INCOME",
  NEW_EXPENSE = "NEW_EXPENSE",
  NEW_PERSON = "NEW_PERSON",
  INCOME_DROPPED = "INCOME_DROPPED",
  HOUSEHOLD_CHANGE = "HOUSEHOLD_CHANGE",
  HOUSING_COST_CHANGE = "HOUSING_COST_CHANGE",
  EXPENSE_REVIEW = "EXPENSE_REVIEW",
  EXPENSE_CAPPED = "EXPENSE_CAPPED",
  INCOME_DUPLICATED = "INCOME_DUPLICATED",
  CHILD_NOT_FULL_TIME = "CHILD_NOT_FULL_TIME",
  CHILDREN_RESIDENCE_CHANGED = "CHILDREN_RESIDENCE_CHANGED",
  HOUSING_SITUATION_CHANGED = "HOUSING_SITUATION_CHANGED",
  SALARY_JOB_STIMULUS = "SALARY_JOB_STIMULUS",
  PENDING_BENEFIT = "PENDING_BENEFIT",
  NEW_ASSETS = "NEW_ASSETS",
  PLANNING_REVIEW = "PLANNING_REVIEW",
  PAYMENT_METHOD_CHANGED = "PAYMENT_METHOD_CHANGED",
  ATTACHMENTS_PRESENT = "ATTACHMENTS_PRESENT",
  STAY_OUTSIDE_MUNICIPALITY = "STAY_OUTSIDE_MUNICIPALITY",
  APPLICATION_REVIEW = "APPLICATION_REVIEW",
  INCOME_MISSING_VS_PREVIOUS_CALCULATION = "INCOME_MISSING_VS_PREVIOUS_CALCULATION",
  INCOME_AMOUNT_MISMATCH_PREVIOUS_CALCULATION = "INCOME_AMOUNT_MISMATCH_PREVIOUS_CALCULATION",
  CHILDREN_MISMATCH_PREVIOUS_CALCULATION = "CHILDREN_MISMATCH_PREVIOUS_CALCULATION",
  HOUSEHOLD_COUNT_MISMATCH_PREVIOUS_CALCULATION = "HOUSEHOLD_COUNT_MISMATCH_PREVIOUS_CALCULATION",
  NORM_MISMATCH_PREVIOUS_CALCULATION = "NORM_MISMATCH_PREVIOUS_CALCULATION",
  SSBTEK_DAY_CHECK = "SSBTEK_DAY_CHECK",
  PARENTAL_BENEFIT_PERIOD_CHECK = "PARENTAL_BENEFIT_PERIOD_CHECK",
  PREVIOUS_DECISION_ADVANCE_ON_BENEFIT = "PREVIOUS_DECISION_ADVANCE_ON_BENEFIT",
  EXPENSE_PARTIALLY_REJECTED = "EXPENSE_PARTIALLY_REJECTED",
  CO_APPLICANT_SPLIT_PAYMENT = "CO_APPLICANT_SPLIT_PAYMENT",
  SSBTEK_READ_FAILED = "SSBTEK_READ_FAILED",
  INCOME_MISSING_PREVIOUS_PERIOD = "INCOME_MISSING_PREVIOUS_PERIOD",
}

/** The Draken view section (tab) the warning belongs to — derived from the type: the decision proposal's types are DECISION, the payment proposal's are PAYMENT, everything else is CALCULATION */
export enum WarningSectionEnum {
  CALCULATION = "CALCULATION",
  DECISION = "DECISION",
  PAYMENT = "PAYMENT",
}

/** The warning status (machine code; use statusDisplayName for the label) */
export enum WarningStatusEnum {
  OPEN = "OPEN",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  CLOSED = "CLOSED",
}

/** The envelope section the item came from */
export enum SupplementsIngestOutcomeSectionEnum {
  Reminders = "reminders",
  Documents = "documents",
  JobStimulus = "jobStimulus",
}

/** What happened to the item */
export enum SupplementsIngestOutcomeOutcomeEnum {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  UNCHANGED = "UNCHANGED",
  REPLACED = "REPLACED",
  SKIPPED = "SKIPPED",
  FAILED = "FAILED",
}

/** Decision outcome code. BIFALL/DELAVSLAG grant an amount (and require payments); AVSLAG/AVVISNING grant nothing. */
export enum FinalizeDecisionOutcomeEnum {
  BIFALL = "BIFALL",
  DELAVSLAG = "DELAVSLAG",
  AVSLAG = "AVSLAG",
  AVVISNING = "AVVISNING",
}

/** The role of the household member */
export enum NormPersonInputRoleEnum {
  APPLICANT = "APPLICANT",
  CO_APPLICANT = "CO_APPLICANT",
  CHILD = "CHILD",
}

/** Who created the row: the process or a caseworker */
export enum NormPersonRowOriginEnum {
  SYSTEM = "SYSTEM",
  CASEWORKER = "CASEWORKER",
}

/** The role of the household member */
export enum NormPersonRowRoleEnum {
  APPLICANT = "APPLICANT",
  CO_APPLICANT = "CO_APPLICANT",
  CHILD = "CHILD",
}

/** Who created the row: the process or a caseworker */
export enum NormIncomeRowOriginEnum {
  SYSTEM = "SYSTEM",
  CASEWORKER = "CASEWORKER",
}

/** Which Lifecare bucket the expense posts to */
export enum NormExpenseInputBucketEnum {
  EXPENSE = "EXPENSE",
  SPECIAL_EXPENSE = "SPECIAL_EXPENSE",
}

/** Who created the row: the process or a caseworker */
export enum NormExpenseRowOriginEnum {
  SYSTEM = "SYSTEM",
  CASEWORKER = "CASEWORKER",
}

/** Which Lifecare bucket the expense posts to */
export enum NormExpenseRowBucketEnum {
  EXPENSE = "EXPENSE",
  SPECIAL_EXPENSE = "SPECIAL_EXPENSE",
}

/** The errand type slug to create the application against */
export enum ApplicationSuggestionTypeSlugEnum {
  FinancialAssistanceNew = "financial-assistance-new",
  FinancialAssistanceRenewal = "financial-assistance-renewal",
  FinancialAssistanceSupplementary = "financial-assistance-supplementary",
}

/** The application type the slug maps to */
export enum ApplicationSuggestionApplicationTypeEnum {
  NEW = "NEW",
  RENEWAL = "RENEWAL",
  SUPPLEMENTARY = "SUPPLEMENTARY",
}

/** Machine-readable code for the gate that drove the suggestion */
export enum EligibilityResponseReasonCodeEnum {
  NO_EXISTING_CASE = "NO_EXISTING_CASE",
  MARITAL_STATUS_CHANGED = "MARITAL_STATUS_CHANGED",
  RECENTLY_CLOSED = "RECENTLY_CLOSED",
  NO_RECENT_DECISION = "NO_RECENT_DECISION",
  ONGOING_APPLICATION = "ONGOING_APPLICATION",
  EXISTING_CASE = "EXISTING_CASE",
  ALL_TYPES_TEST = "ALL_TYPES_TEST",
}

/** The section this approval concerns */
export enum SectionApprovalSectionEnum {
  CALCULATION = "CALCULATION",
  PAYMENT = "PAYMENT",
  DECISION = "DECISION",
}

/** The norm type */
export enum NormHeaderInputNormTypeEnum {
  NATIONAL_NORM = "NATIONAL_NORM",
  OTHER_NORM = "OTHER_NORM",
}

/** Direction */
export enum MessageDirectionEnum {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

/** Who sent the file, derived from the message direction: CLIENT (applicant, INBOUND) or CASEWORKER (caseworker, OUTBOUND) */
export enum MessageAttachmentSenderRoleEnum {
  CLIENT = "CLIENT",
  CASEWORKER = "CASEWORKER",
}

/** What kind of document this is: APPLICATION (citizen's application files), CONVERSATION (sent in a message thread), GENERATED (a consolidated PDF produced by the platform), ERRAND (uploaded directly to the errand), CASE_DATA (a case-data document for the errand), DECISION (a decision document for the errand) or MESSAGE_HISTORY (the archived conversation PDF for a closed errand) */
export enum AttachmentDocumentTypeEnum {
  APPLICATION = "APPLICATION",
  CONVERSATION = "CONVERSATION",
  GENERATED = "GENERATED",
  ERRAND = "ERRAND",
  CASE_DATA = "CASE_DATA",
  DECISION = "DECISION",
  MESSAGE_HISTORY = "MESSAGE_HISTORY",
}

/** Who the file came from: CLIENT (applicant) or CASEWORKER (caseworker). May be null for files predating the distinction or with no clear sender. */
export enum AttachmentSenderRoleEnum {
  CLIENT = "CLIENT",
  CASEWORKER = "CASEWORKER",
}

/** Where the proposed payee came from: PREVIOUS_PAYMENT (the most recent Lifecare payment) or APPLICATION (the applicant stated a new account in the application, paymentSameAsPrevious=false). Null when no payee could be proposed */
export enum PaymentProposalPayeeSourceEnum {
  PREVIOUS_PAYMENT = "PREVIOUS_PAYMENT",
  APPLICATION = "APPLICATION",
}

/** Whose period it is */
export enum JobStimulusPeriodRoleEnum {
  APPLICANT = "APPLICANT",
  CO_APPLICANT = "CO_APPLICANT",
}

/** The input kind as rendered */
export enum FormSnapshotFieldInputTypeEnum {
  RADIO = "RADIO",
  CHECKBOX = "CHECKBOX",
  SELECT = "SELECT",
  TEXT = "TEXT",
  TEXTAREA = "TEXTAREA",
  NUMBER = "NUMBER",
  DATE = "DATE",
  BOOLEAN_TOGGLE = "BOOLEAN_TOGGLE",
  REPEATING_GROUP = "REPEATING_GROUP",
  STATIC = "STATIC",
}

/** The notice level */
export enum FormSnapshotNoticeLevelEnum {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

/** The proposed decision outcome. Rule: estimatedAmount <= 0 → AVSLAG; estimatedAmount > 0 and every expense fully approved → BIFALL; estimatedAmount > 0 and any expense approved below the applied amount → DELAVSLAG. Null when no amount could be estimated (see explanation) */
export enum DecisionProposalOutcomeEnum {
  BIFALL = "BIFALL",
  DELAVSLAG = "DELAVSLAG",
  AVSLAG = "AVSLAG",
}

/** Stable code for the Mina-sidor form section the type is shown under; null for income */
export enum TypeOptionGroupEnum {
  HOUSING = "HOUSING",
  WORK_AND_STUDIES = "WORK_AND_STUDIES",
  HEALTH = "HEALTH",
  OTHER = "OTHER",
}

/** The field kind */
export enum FieldDescriptorTypeEnum {
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",
  INTEGER = "INTEGER",
  DECIMAL = "DECIMAL",
  DATE_TIME = "DATE_TIME",
  ENUM = "ENUM",
  ARRAY = "ARRAY",
}

/** Lookup kind */
export enum ReadLookupsParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
}

/** Lookup kind */
export enum CreateLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
}

/** Only return attachments with this documentType */
export enum ReadAttachmentsParamsDocumentTypeEnum {
  APPLICATION = "APPLICATION",
  CONVERSATION = "CONVERSATION",
  GENERATED = "GENERATED",
  ERRAND = "ERRAND",
  CASE_DATA = "CASE_DATA",
  DECISION = "DECISION",
  MESSAGE_HISTORY = "MESSAGE_HISTORY",
}

/** Only return attachments from this sender */
export enum ReadAttachmentsParamsSenderRoleEnum {
  CLIENT = "CLIENT",
  CASEWORKER = "CASEWORKER",
}

/** What the uploaded file is: ERRAND (a plain manual upload, the default), CASE_DATA (a case-data document) or DECISION (a decision document). Defaults to ERRAND when omitted. */
export enum CreateAttachmentParamsDocumentTypeEnum {
  ERRAND = "ERRAND",
  CASE_DATA = "CASE_DATA",
  DECISION = "DECISION",
}

/** Lookup kind */
export enum ReadLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
}

/** Lookup kind */
export enum DeleteLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
}

/** Lookup kind */
export enum UpdateLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
}

/** The target status */
export enum UpdateWarningParamsStatusEnum {
  OPEN = "OPEN",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  CLOSED = "CLOSED",
}

/** The section to approve */
export enum SetSectionApprovalParamsSectionEnum {
  CALCULATION = "CALCULATION",
  PAYMENT = "PAYMENT",
  DECISION = "DECISION",
}

export enum SetSectionApprovalParamsEnum {
  CALCULATION = "CALCULATION",
  PAYMENT = "PAYMENT",
  DECISION = "DECISION",
}
