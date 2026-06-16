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
  detail?: string;
  title?: string;
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

/** Direction */
export enum MessageDirectionEnum {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
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
