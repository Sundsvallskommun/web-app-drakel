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
   * Year the asset was purchased
   * @format int32
   */
  purchaseYear?: number;
  /** Price paid when the asset was purchased */
  purchasePrice?: number;
  /** Name of the company asset */
  companyName?: string;
  /** Total sum of the company's assets */
  companyAssetSum?: number;
  /** Type of vehicle */
  vehicleType?: AssetVehicleTypeEnum;
  /** Vehicle registration number */
  registrationNumber?: string;
  /**
   * The date the asset was purchased
   * @format date
   */
  purchaseDate?: string;
}

/** A child included in the financial assistance application. */
export interface Child {
  /** Party id (personId GUID) of the child */
  partyId?: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Name of the child's school */
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
  /** The norm type used for the calculation */
  normType?: FinancialAssistanceDataNormTypeEnum;
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
  /** The job title applied for */
  jobTitle?: string;
  /** Employer and place of work */
  employerAndPlace?: string;
}

/** A benefit the applicant has applied for but not yet received a decision on. */
export interface PendingBenefit {
  /** Name of the pending benefit */
  benefitName?: string;
  /** Name of the person who applied for the benefit */
  applicantName?: string;
}

/** A person (applicant or co-applicant) on the financial assistance application. */
export interface Person {
  /** Role of the person */
  role?: PersonRoleEnum;
  /** Party id (personId GUID) of the person */
  partyId?: string;
  /** Whether the person needs an interpreter */
  needsInterpreter?: boolean;
  /** Language the interpreter should use */
  interpreterLanguage?: string;
  /** Whether the person had work during the last 12 months */
  hadWorkLast12Months?: boolean;
  /** Description of the work the person had */
  hadWorkDescription?: string;
  /** Payment method */
  paymentMethod?: PersonPaymentMethodEnum;
  /** Clearing number of the bank account */
  clearingNumber?: string;
  /** Bank account number */
  accountNumber?: string;
  /** Description of the payment method when OTHER */
  otherPaymentDescription?: string;
  /** Whether the payment details are the same as previously used */
  paymentSameAsPrevious?: boolean;
  /** Email address used for notifications about the application */
  email?: string;
  /** Phone number used for SMS notifications about the application */
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
  /** SFI study path */
  sfiStudyPath?: PlanningSfiStudyPathEnum;
  /** SFI course */
  sfiCourse?: PlanningSfiCourseEnum;
  /** Description of other planning */
  otherDescription?: string;
}

/** NamespaceConfig model */
export interface NamespaceConfig {
  /**
   * Unique identifier
   * @format int64
   */
  id?: number;
  /** Display name of the namespace */
  displayName?: string;
  /** Short code for the namespace */
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
  /** Name (machine-friendly key) of the lookup */
  name?: string;
  /** Display name */
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
  /** Registered errand type slug — validated against ErrandTypeRegistry */
  typeSlug?: string;
  /** Title for the errand */
  title?: string;
  /** Status of the errand */
  status?: string;
  /** Description of the errand */
  description?: string;
  /** Priority of the errand */
  priority?: string;
  /** User id of the reporter */
  reporterUserId?: string;
  /** User id of the assignee */
  assignedUserId?: string;
  /** Name of the Operaton process definition to start when the errand is created */
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

/** ContactChannel model */
export interface ContactChannel {
  /** The key of the contact channel */
  key?: string;
  /** The value of the contact channel */
  value?: string;
}

/** Stakeholder */
export interface Stakeholder {
  /** Unique identifier */
  id?: string;
  /** External id for the stakeholder */
  externalId?: string;
  /** Type of external id */
  externalIdType?: string;
  /** Role of the stakeholder — validated against StakeholderRoleRegistry for the errand's typeSlug */
  role?: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Organization name */
  organizationName?: string;
  /** Address */
  address?: string;
  /** Care of */
  careOf?: string;
  /** Zip code */
  zipCode?: string;
  /** City */
  city?: string;
  /** Country */
  country?: string;
  /** Contact channels for the stakeholder */
  contactChannels?: ContactChannel[];
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

/** Request body for correlating a BPMN message to the process instance currently running for an errand. The errand id is used as the process business key, so the message is delivered to that specific process. Use this whenever something outside the process (a handläggare action, an external event, an admin override) needs to resume or interact with a running process instance. */
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
  /** User id of the recipient (the user who should see this notification) */
  ownerId?: string;
  /** User or system id that produced the notification. Automatically acknowledged if equal to ownerId. */
  createdBy?: string;
  /** Notification type */
  type?: NotificationTypeEnum;
  /** Notification sub-type */
  subType?: NotificationSubTypeEnum;
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

/** Decision recorded against an errand. Both system-generated decisions (e.g. a DMN-evaluated recommendation produced by a BPMN process) and human decisions (e.g. a handläggare approving a payment) are stored here, distinguished by `decisionType`. The list on the errand grows over time and is the audit trail of every decision made on the case. */
export interface Decision {
  /** Unique identifier */
  id?: string;
  /** Decision category. Free-form string; conventionally `RECOMMENDATION` for DMN-produced suggestions and `PAYMENT` for handläggare APPROVE/REJECT decisions, but namespaces are encouraged to define their own. */
  decisionType?: string;
  /** Decision value. For binary outcomes use `APPROVED`/`REJECTED`; for richer outputs (e.g. a calculated amount) use the value itself or a short label. */
  value?: string;
  /** Optional human-readable description or motivation for the decision */
  description?: string;
  /** Identifier of the actor that produced the decision. Use the handläggare userId for human decisions or a system identifier (e.g. `operaton`, `dmn-engine`) for automated ones. */
  createdBy?: string;
  /**
   * Timestamp the decision was recorded (server-assigned)
   * @format date-time
   */
  created?: string;
}

/** Request to create an EB income warning on an errand (no Lifecare round-trip). */
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
  /** A stable key for the income the warning concerns (förmån/inkomsttyp) — the dedup key. Derived from the message when omitted. */
  sourceKey?: string;
}

/** An EB income warning the handläggare can acknowledge or close. */
export interface Warning {
  /** The warning id */
  id?: string;
  /** The warning type */
  type?: WarningTypeEnum;
  /** A stable key for the income the warning concerns (förmån/inkomsttyp) — the dedup key */
  sourceKey?: string;
  /** Human-readable warning text */
  message?: string;
  /** The warning status */
  status?: WarningStatusEnum;
  /** Whether the warning was closed automatically (its cause resolved) rather than by a handläggare */
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

/** What a handläggare sends to add or patch a person row (identity + handläggare-writable fields only). */
export interface NormPersonInput {
  /** The party id of the household member */
  partyId?: string;
  /** The role of the household member */
  role?: NormPersonInputRoleEnum;
  /** The name of the household member */
  name?: string;
  /**
   * The number of days the handläggare decided
   * @format int32
   */
  handlaggareDays?: number;
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
  /** The jobbstimulans amount applied to the member */
  jobbstimulansAmount?: number;
  /** Free-text note */
  note?: string;
}

/** One person row of the normberäkning draft (household member, process vs handläggare days). */
export interface NormPersonRow {
  /** The row id */
  id?: string;
  /** Who created the row: the process or a handläggare */
  origin?: NormPersonRowOriginEnum;
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
   * The number of days a handläggare decided; overrides the process value when set
   * @format int32
   */
  handlaggareDays?: number;
  /**
   * The number of days actually used (handläggare value when set, otherwise process value)
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
  /** The jobbstimulans amount applied to the member */
  jobbstimulansAmount?: number;
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

/** What a handläggare sends to add or patch an income row (identity + handläggare-writable fields only). */
export interface NormIncomeInput {
  /**
   * The FC income-type id
   * @format int32
   */
  typeId?: number;
  /** The FC income-type name */
  typeName?: string;
  /** The amount the handläggare decided for the applicant */
  applicantHandlaggareAmount?: number;
  /**
   * The date the applicant amount is attributed to
   * @format date-time
   */
  applicantAmountDate?: string;
  /** The amount the handläggare decided for the co-applicant */
  coapplicantHandlaggareAmount?: number;
  /**
   * The date the co-applicant amount is attributed to
   * @format date-time
   */
  coapplicantAmountDate?: string;
  /** Free-text note */
  note?: string;
}

/** One income row of the normberäkning draft (FC income type with applicant/co-applicant sides, process vs handläggare amounts). */
export interface NormIncomeRow {
  /** The row id */
  id?: string;
  /** Who created the row: the process or a handläggare */
  origin?: NormIncomeRowOriginEnum;
  /**
   * The FC income-type id
   * @format int32
   */
  typeId?: number;
  /** The FC income-type name */
  typeName?: string;
  /** The amount the process decided for the applicant (from the classified SSBTEK income) */
  applicantProcessAmount?: number;
  /** The amount a handläggare decided for the applicant; overrides the process amount when set */
  applicantHandlaggareAmount?: number;
  /** The amount actually used for the applicant (handläggare amount when set, otherwise process amount) */
  applicantEffectiveAmount?: number;
  /**
   * The date the applicant amount is attributed to
   * @format date-time
   */
  applicantAmountDate?: string;
  /** The amount the process decided for the co-applicant (from the classified SSBTEK income) */
  coapplicantProcessAmount?: number;
  /** The amount a handläggare decided for the co-applicant; overrides the process amount when set */
  coapplicantHandlaggareAmount?: number;
  /** The amount actually used for the co-applicant (handläggare amount when set, otherwise process amount) */
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

/** What a handläggare sends to add or patch an expense row (identity + handläggare-writable fields only). */
export interface NormExpenseInput {
  /** The cost type */
  costType?: string;
  /** Which Lifecare bucket the expense posts to */
  bucket?: NormExpenseInputBucketEnum;
  /** The other sub-type (when the cost type is 'other') */
  otherSubType?: string;
  /** The cost specification */
  specification?: string;
  /** The amount the handläggare decided */
  handlaggareAmount?: number;
  /** Free-text note */
  note?: string;
}

/** One expense row of the normberäkning draft (applied cost, process vs handläggare amount). */
export interface NormExpenseRow {
  /** The row id */
  id?: string;
  /** Who created the row: the process or a handläggare */
  origin?: NormExpenseRowOriginEnum;
  /** Which Lifecare bucket the expense posts to */
  bucket?: NormExpenseRowBucketEnum;
  /** The cost type */
  costType?: string;
  /** The other sub-type (when the cost type is 'other') */
  otherSubType?: string;
  /** The cost specification */
  specification?: string;
  /** The amount the citizen applied for */
  appliedAmount?: number;
  /** The amount the regelverk allowed (the process amount) */
  processAmount?: number;
  /** The amount a handläggare decided; overrides the process amount when set */
  handlaggareAmount?: number;
  /** The amount actually used (handläggare amount when set, otherwise process amount) */
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

/** Request to read whether the Lifecare utbetalning for an application month has been effectuated. */
export interface PaymentStatusRequest {
  /** The applicant's partyId (personId GUID) */
  applicant: string;
  /**
   * The application month (ISO year-month, yyyy-MM) the payment concerns
   * @pattern ^\d{4}-(0[1-9]|1[0-2])$
   */
  applicationMonth: string;
}

/** Whether the Lifecare utbetalning for the application month has been effectuated. */
export interface PaymentStatusResponse {
  /** True when a Lifecare utbetalning concerning the application month has been registered */
  effectuated?: boolean;
  /** The date the utbetalning was made (Lifecare PayDate), when effectuated */
  paymentDate?: string;
}

/** Request to build and post the SSBTEK-driven normberäkning for an application month. */
export interface NormberakningRequest {
  /** The applicant's partyId (personId GUID) */
  applicant: string;
  /** The co-applicant's (medsökande) partyId (personId GUID), when applying together with a partner */
  coApplicant?: string;
  /**
   * The application month (ISO year-month, yyyy-MM)
   * @pattern ^\d{4}-(0[1-9]|1[0-2])$
   */
  applicationMonth: string;
  /** The id of the caremanagement errand the normberäkning concerns. When present, a Decision(RECOMMENDATION) summarising the income warnings is recorded on the errand for the handläggare to review; when omitted, the normberäkning is built without recording a recommendation. */
  errandId?: string;
  /** The incomes classified by the operaton regelverk (the evaluate-income-regelverk worker output), as JSON. When present, caremanagement maps these to FC income rows instead of fetching SSBTEK and evaluating the rålista itself. */
  classifiedIncomes?: string;
  /** The unhandled-income warnings from the operaton regelverk, recorded on the errand recommendation */
  unhandledIncomes?: string[];
  /** The period-over-period change warnings from the operaton regelverk, recorded on the errand recommendation */
  changeWarnings?: string[];
}

/** The created Lifecare normberäkning id plus the income warnings to review. */
export interface NormberakningResponse {
  /**
   * The id of the normberäkning created in Lifecare FC
   * @format int32
   */
  calculationId?: number;
  /** SSBTEK incomes that could not be auto-transferred and must be reviewed */
  unhandledIncomes?: string[];
  /** Förmåner whose net income changed beyond the threshold between the periods */
  changeWarnings?: string[];
  /** Whether this month's normberäkning covers every income type the previous month's did — false means SSBTEK data is still missing and the process should poll again */
  informationComplete?: boolean;
  /** Previous-month income types not yet present this month (the SSBTEK data still being awaited) */
  missingIncomeTypes?: string[];
}

/** Request to evaluate which financial assistance application a citizen should be offered. */
export interface EligibilityRequest {
  /** The applicant's partyId (personId GUID) */
  applicant: string;
  /** The co-applicant's (medsökande) partyId (personId GUID), when applying together with a partner */
  coApplicant?: string;
}

/** A suggested application the citizen can submit, with its target period. */
export interface ApplicationSuggestion {
  /** The errand type slug to create the application against */
  typeSlug?: ApplicationSuggestionTypeSlugEnum;
  /** The application type the slug maps to */
  applicationType?: ApplicationSuggestionApplicationTypeEnum;
  /**
   * Month (1-12) the suggested application concerns. Null for a new application (nyansökan), which has no prior period.
   * @format int32
   */
  periodMonth?: number;
  /**
   * Year the suggested application concerns. Null for a new application (nyansökan).
   * @format int32
   */
  periodYear?: number;
  /** True for the primary suggestion the citizen should be guided towards */
  recommended?: boolean;
  /** Human-readable Swedish label for the suggestion */
  label?: string;
}

/** Eligibility result: which application(s) the citizen should be offered, plus the supporting facts. */
export interface EligibilityResponse {
  /** Suggested applications, ordered with the recommended one first. */
  suggestions?: ApplicationSuggestion[];
  /** Machine-readable code for the gate that drove the suggestion */
  reasonCode?: EligibilityResponseReasonCodeEnum;
  /** Human-readable Swedish explanation of the suggestion */
  message?: string;
  /** True when the applicant already has an EB errand in caremanagement */
  existsInCm?: boolean;
  /** True when the applicant has an EB footprint in Lifecare (aktualisering/beslut/normberäkning) */
  existsInLc?: boolean;
  /** Whether the requested civilstånd (alone vs with a partner) matches the previous application. Null when not evaluated (no existing case). */
  civilstandMatches?: boolean;
  /**
   * The duplicate-application window in days that was applied to the per-month check
   * @format int32
   */
  windowDays?: number;
  /** True when an application/decision already exists for the current month */
  applicationExistsThisMonth?: boolean;
  /** True when an application/decision already exists for next month */
  applicationExistsNextMonth?: boolean;
  /** True when Lifecare shows a decision for the current month (the current month is decided/closed) */
  currentMonthDecided?: boolean;
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
  /** True when Lifecare shows a previous normberäkning */
  hasPreviousCalculation?: boolean;
  /** True when the Lifecare lookup succeeded. False means the answer is degraded (CM-only). */
  lifecareChecked?: boolean;
  /** True when the request included a co-applicant (medsökande) */
  hasCoApplicant?: boolean;
}

/** Request to create the Lifecare aktualisering (case intake) for an application month. */
export interface ActualisationRequest {
  /** The applicant's partyId (personId GUID) */
  applicant: string;
  /**
   * The application month (ISO year-month, yyyy-MM); the aktualisering's intake date is the first day of this month
   * @pattern ^\d{4}-(0[1-9]|1[0-2])$
   */
  applicationMonth: string;
  /** The id of the caremanagement errand the aktualisering concerns. When present, a Decision(ACTUALISATION) recording the created Lifecare aktualisering id is added to the errand's audit trail; when omitted, the aktualisering is created without recording anything on an errand. */
  errandId?: string;
}

/** The created Lifecare aktualisering id. */
export interface ActualisationResponse {
  /**
   * The id of the aktualisering created in Lifecare FC
   * @format int32
   */
  actualisationId?: number;
}

/** PatchErrand model — patchable envelope fields only */
export interface PatchErrand {
  /** Title for the errand */
  title?: string;
  /** Status of the errand */
  status?: string;
  /** Description of the errand */
  description?: string;
  /** Priority of the errand */
  priority?: string;
  /** User id of the reporter */
  reporterUserId?: string;
  /** User id of the assignee */
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
  /**
   * Note body
   * @example "Spoke to family today, awaiting docs."
   */
  body?: string;
  /**
   * Author user id
   * @example "jane01doe"
   */
  author?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * User id of the last editor
   * @example "jane01doe"
   */
  modifiedBy?: string;
  /**
   * Last modified timestamp; null until the note has been edited
   * @format date-time
   */
  modified?: string;
}

/** Handläggare edit of the normberäkning header — norm, calculation dates and custom household size. */
export interface NormHeaderInput {
  /**
   * The selected FC norm id (Norm)
   * @format int32
   */
  normId?: number;
  /** The norm type */
  normType?: NormHeaderInputNormTypeEnum;
  /**
   * Calculation period start (Från)
   * @format date
   */
  calculationFromDate?: string;
  /**
   * Calculation period end (Till)
   * @format date
   */
  calculationToDate?: string;
  /**
   * Calculation date (Beräkningsdatum)
   * @format date
   */
  calculationDate?: string;
  /** Whether a custom household size is used (Annan hushållsstorlek) */
  hasCustomHouseholdSize?: boolean;
  /**
   * The custom household size (Hushållsstorlek)
   * @format int32
   */
  householdSize?: number;
}

/** The full draft normberäkning — header, the three sections (personer, inkomster, utgifter) and the section sums. */
export interface NormberakningDraft {
  /** The errand id */
  errandId?: string;
  /** The application month (ISO yyyy-MM) */
  applicationMonth?: string;
  /**
   * The selected norm id
   * @format int32
   */
  normId?: number;
  /** The selected norm type */
  normType?: string;
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
  /** Whether the household size has been overridden by a handläggare */
  hasCustomHouseholdSize?: boolean;
  /**
   * The household size used for the norm
   * @format int32
   */
  householdSize?: number;
  /** The person rows (personer) */
  persons?: NormPersonRow[];
  /** The income rows (inkomster) */
  incomes?: NormIncomeRow[];
  /** The expense rows (utgifter) */
  expenses?: NormExpenseRow[];
  /** The special expense rows (särskilda utgifter) */
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
  /** Who sent the file, derived from the message direction: CLIENT (applicant, INBOUND) or HANDLAGGARE (caseworker, OUTBOUND) */
  senderRole?: MessageAttachmentSenderRoleEnum;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
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
  /** Where the file came from: APPLICATION (citizen's application files), CONVERSATION (sent in a message thread), GENERATED (a consolidated PDF produced by the platform) or ERRAND (uploaded directly to the errand) */
  origin?: AttachmentOriginEnum;
  /** Who the file came from: CLIENT (applicant) or HANDLAGGARE (caseworker). May be null for files predating the distinction or with no clear sender. */
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
  /** The typed financial assistance application payload */
  data?: FinancialAssistanceData;
}

/** A child pre-filled from Lifecare for a financial assistance renewal. Carries only what Lifecare provides — personnummer and name; the citizen completes residence, school etc. on the form. */
export interface PrefilledChild {
  /** Party id (personId GUID) of the child */
  partyId?: string;
  /** Name as registered in Lifecare */
  name?: string;
}

/** Pre-fill data for a financial assistance renewal (återansökan): household children read from Lifecare. */
export interface RenewalPrefill {
  /** Children in the household from the most recent normberäkning */
  children?: PrefilledChild[];
  /** True when the Lifecare lookup succeeded. False means the answer is degraded (empty children). */
  lifecareChecked?: boolean;
}

/** Form descriptor for an errand type slug — statuses, roles and the fields its data payload should carry. */
export interface ErrandTypeSchema {
  /** The errand type slug */
  typeSlug?: string;
  /** The application-type variant the slug maps to, when the type exposes one; null otherwise */
  applicationType?: string;
  /** Human-readable display name of the type */
  displayName?: string;
  /** Allowed status codes for the type, sorted */
  statuses?: string[];
  /** Stakeholder roles valid for the type */
  roles?: RoleDefinition[];
  /** The fields the type's data payload should carry, as form guidance */
  fields?: FieldDescriptor[];
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
  BOSTADSRATT = "BOSTADSRATT",
  VILLA = "VILLA",
  FASTIGHET = "FASTIGHET",
  FRITIDSHUS = "FRITIDSHUS",
}

/** Type of vehicle */
export enum AssetVehicleTypeEnum {
  BIL = "BIL",
  BAT = "BAT",
  MC = "MC",
  HUSVAGN = "HUSVAGN",
  MOPED = "MOPED",
  SNOSKOTER = "SNOSKOTER",
  ANNAT = "ANNAT",
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

/** The norm type used for the calculation */
export enum FinancialAssistanceDataNormTypeEnum {
  RIKSNORM = "RIKSNORM",
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

/** The warning type */
export enum WarningTypeEnum {
  UNHANDLED_INCOME = "UNHANDLED_INCOME",
  INCOME_CHANGE = "INCOME_CHANGE",
  MISSING_SSBTEK = "MISSING_SSBTEK",
  NEW_INCOME = "NEW_INCOME",
}

/** The warning status */
export enum WarningStatusEnum {
  OPEN = "OPEN",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  CLOSED = "CLOSED",
}

/** The role of the household member */
export enum NormPersonInputRoleEnum {
  APPLICANT = "APPLICANT",
  CO_APPLICANT = "CO_APPLICANT",
  CHILD = "CHILD",
}

/** Who created the row: the process or a handläggare */
export enum NormPersonRowOriginEnum {
  SYSTEM = "SYSTEM",
  HANDLAGGARE = "HANDLAGGARE",
}

/** The role of the household member */
export enum NormPersonRowRoleEnum {
  APPLICANT = "APPLICANT",
  CO_APPLICANT = "CO_APPLICANT",
  CHILD = "CHILD",
}

/** Who created the row: the process or a handläggare */
export enum NormIncomeRowOriginEnum {
  SYSTEM = "SYSTEM",
  HANDLAGGARE = "HANDLAGGARE",
}

/** Which Lifecare bucket the expense posts to */
export enum NormExpenseInputBucketEnum {
  EXPENSE = "EXPENSE",
  SPECIAL_EXPENSE = "SPECIAL_EXPENSE",
}

/** Who created the row: the process or a handläggare */
export enum NormExpenseRowOriginEnum {
  SYSTEM = "SYSTEM",
  HANDLAGGARE = "HANDLAGGARE",
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
  CIVILSTAND_CHANGED = "CIVILSTAND_CHANGED",
  EXISTING_CASE = "EXISTING_CASE",
  ALL_TYPES_TEST = "ALL_TYPES_TEST",
}

/** The norm type */
export enum NormHeaderInputNormTypeEnum {
  RIKSNORM = "RIKSNORM",
  OTHER_NORM = "OTHER_NORM",
}

/** Direction */
export enum MessageDirectionEnum {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

/** Who sent the file, derived from the message direction: CLIENT (applicant, INBOUND) or HANDLAGGARE (caseworker, OUTBOUND) */
export enum MessageAttachmentSenderRoleEnum {
  CLIENT = "CLIENT",
  HANDLAGGARE = "HANDLAGGARE",
}

/** Where the file came from: APPLICATION (citizen's application files), CONVERSATION (sent in a message thread), GENERATED (a consolidated PDF produced by the platform) or ERRAND (uploaded directly to the errand) */
export enum AttachmentOriginEnum {
  APPLICATION = "APPLICATION",
  CONVERSATION = "CONVERSATION",
  GENERATED = "GENERATED",
  ERRAND = "ERRAND",
}

/** Who the file came from: CLIENT (applicant) or HANDLAGGARE (caseworker). May be null for files predating the distinction or with no clear sender. */
export enum AttachmentSenderRoleEnum {
  CLIENT = "CLIENT",
  HANDLAGGARE = "HANDLAGGARE",
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
}

/** Lookup kind */
export enum CreateLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
}

/** Only return attachments with this origin */
export enum ReadAttachmentsParamsOriginEnum {
  APPLICATION = "APPLICATION",
  CONVERSATION = "CONVERSATION",
  GENERATED = "GENERATED",
  ERRAND = "ERRAND",
}

/** Only return attachments from this sender */
export enum ReadAttachmentsParamsSenderRoleEnum {
  CLIENT = "CLIENT",
  HANDLAGGARE = "HANDLAGGARE",
}

/** Lookup kind */
export enum ReadLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
}

/** Lookup kind */
export enum DeleteLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
}

/** Lookup kind */
export enum UpdateLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
}

/** The target status */
export enum UpdateWarningParamsStatusEnum {
  ACKNOWLEDGED = "ACKNOWLEDGED",
  CLOSED = "CLOSED",
}
