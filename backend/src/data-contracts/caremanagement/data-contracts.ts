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

/** Request to create or replace an EB monitoring on an errand. */
export interface MonitoringRequest {
  /** Provenance, defaults to CASEWORKER when omitted. RPA POSTs LIFECARE (with lifecareId) to surface a monitoring read out of Lifecare onto the errand. */
  source?: MonitoringRequestSourceEnum;
  /** The monitoring's id in Lifecare. Set by RPA when surfacing a LIFECARE-sourced monitoring (the idempotency key) or when stamping back the id of a mirrored caseworker monitoring. */
  lifecareId?: string;
  /**
   * Short headline for the monitoring
   * @minLength 1
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
  /** The caseworker who created the monitoring */
  createdBy?: string;
}

/** An EB monitoring (date-bound watch/reminder) on an errand. */
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

/** Request to enqueue a UiPath RPA task on an errand. */
export interface RpaTaskRequest {
  /**
   * The RPA action — selects the Lifecare flow the robot runs
   * @minLength 1
   */
  action: RpaTaskRequestActionEnum;
  /** Optional extra hints for the robot, merged into the queue item SpecificContent */
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
   * @example "Journalfört meddelande"
   */
  type: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @minLength 0
   * @maxLength 255
   * @example "Journalfört meddelande: 2025-05-30 Info"
   */
  heading: string;
  /**
   * Free-text body of the journal entry; optional
   * @minLength 0
   * @maxLength 1048576
   * @example "Hej! Vill bara informera att jag fått jobb på Mejeriet."
   */
  text?: string;
  /**
   * Documented date (Lifecare 'Datum')
   * @format date
   * @example "2025-05-30"
   */
  entryDate: string;
  /**
   * Documented time (Lifecare 'Tid'); optional
   * @example "14:30"
   */
  entryTime?: string;
  /**
   * User id of the author (Lifecare 'Upprättad av'); optional
   * @minLength 0
   * @maxLength 64
   * @example "carola01winberg"
   */
  createdBy?: string;
}

export interface LockJournalEntry {
  /**
   * User id of whoever locks the entry; optional
   * @minLength 0
   * @maxLength 64
   * @example "carola01winberg"
   */
  lockedBy?: string;
}

/** A journalanteckning (case-journal entry) attached to an errand */
export interface JournalEntry {
  /** Unique identifier */
  id?: string;
  /** Errand id this journal entry belongs to */
  errandId?: string;
  /**
   * Journal entry type (Lifecare 'Typ'/Journaltyp). A municipality-configured value; see the metadata catalogue for a provisional set.
   * @example "Journalfört meddelande"
   */
  type?: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @example "Journalfört meddelande: 2025-05-30 Info"
   */
  heading?: string;
  /**
   * Free-text body of the journal entry
   * @example "Hej! Vill bara informera att jag fått jobb på Mejeriet."
   */
  text?: string;
  /**
   * Documented date (Lifecare 'Datum'), distinct from the system created timestamp
   * @format date
   * @example "2025-05-30"
   */
  entryDate?: string;
  /**
   * Documented time (Lifecare 'Tid'); optional
   * @example "14:30"
   */
  entryTime?: string;
  /**
   * Skrivskydd status — WORKING is an editable arbetsanteckning, LOCKED is an upprättad handling
   * @example "WORKING"
   */
  status?: JournalEntryStatusEnum;
  /**
   * User id of the author (Lifecare 'Upprättad av'/'Ägare')
   * @example "carola01winberg"
   */
  createdBy?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * User id of the last editor (Lifecare 'Ändrat av'); null until the entry has been edited
   * @example "ebb14eri"
   */
  modifiedBy?: string;
  /**
   * Last modified timestamp; null until the entry has been edited
   * @format date-time
   */
  modified?: string;
  /**
   * User id of whoever locked the entry; null while WORKING
   * @example "carola01winberg"
   */
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
   * @example "Brev"
   */
  type: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @minLength 0
   * @maxLength 255
   * @example "Beslut om ekonomiskt bistånd 2025-05"
   */
  heading: string;
  /**
   * Free-text body of the document; optional
   * @minLength 0
   * @maxLength 1048576
   * @example "Beslut har fattats enligt nedan ..."
   */
  text?: string;
  /**
   * Documented date (Lifecare 'Datum')
   * @format date
   * @example "2025-05-30"
   */
  documentDate: string;
  /**
   * Documented time (Lifecare 'Tid'); optional
   * @example "14:30"
   */
  documentTime?: string;
  /**
   * User id of the author (Lifecare 'Upprättad av'); optional
   * @minLength 0
   * @maxLength 64
   * @example "carola01winberg"
   */
  createdBy?: string;
}

export interface LockDocument {
  /**
   * User id of whoever locks the document; optional
   * @minLength 0
   * @maxLength 64
   * @example "carola01winberg"
   */
  lockedBy?: string;
}

/** A Dokument (formal case document) attached to an errand */
export interface Document {
  /** Unique identifier */
  id?: string;
  /** Errand id this document belongs to */
  errandId?: string;
  /**
   * Document type (Lifecare 'Typ'/Dokumenttyp). A municipality-configured value; see the metadata catalogue for a provisional set.
   * @example "Brev"
   */
  type?: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @example "Beslut om ekonomiskt bistånd 2025-05"
   */
  heading?: string;
  /**
   * Free-text body of the document
   * @example "Beslut har fattats enligt nedan ..."
   */
  text?: string;
  /**
   * Documented date (Lifecare 'Datum'), distinct from the system created timestamp
   * @format date
   * @example "2025-05-30"
   */
  documentDate?: string;
  /**
   * Documented time (Lifecare 'Tid'); optional
   * @example "14:30"
   */
  documentTime?: string;
  /**
   * Skrivskydd status — WORKING is an editable draft, LOCKED is an upprättad handling
   * @example "WORKING"
   */
  status?: DocumentStatusEnum;
  /**
   * User id of the author (Lifecare 'Upprättad av'/'Ägare')
   * @example "carola01winberg"
   */
  createdBy?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /**
   * User id of the last editor (Lifecare 'Ändrat av'); null until the document has been edited
   * @example "ebb14eri"
   */
  modifiedBy?: string;
  /**
   * Last modified timestamp; null until the document has been edited
   * @format date-time
   */
  modified?: string;
  /**
   * User id of whoever locked the document; null while WORKING
   * @example "carola01winberg"
   */
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
  /** Decision category. Free-form string; conventionally `RECOMMENDATION` for DMN-produced suggestions and `PAYMENT` for caseworker APPROVE/REJECT decisions, but namespaces are encouraged to define their own. */
  decisionType?: string;
  /** Decision value. For binary outcomes use `APPROVED`/`REJECTED`; for richer outputs (e.g. a calculated amount) use the value itself or a short label. */
  value?: string;
  /** Optional human-readable description or motivation for the decision */
  description?: string;
  /** Optional decision amount, in SEK. For a financial-assistance beslut this is the granted belopp (0 for a rejection); for a recommendation it is the recommended amount when the pipeline has computed one. */
  amount?: number;
  /** Optional decision message (beslutsmeddelande) communicated to the applicant — the free-text justification shown on the decision letter, kept separate from the internal `description`. */
  decisionMessage?: string;
  /**
   * Optional date the decision applies (the caseworker-chosen decision date), distinct from the server-assigned `created` audit timestamp.
   * @format date
   */
  decisionDate?: string;
  /**
   * Optional start of the period the decision covers (the month applied for, for a financial-assistance beslut).
   * @format date
   */
  periodFrom?: string;
  /**
   * Optional end of the period the decision covers.
   * @format date
   */
  periodTo?: string;
  /** Identifier of the actor that produced the decision. Use the caseworker userId for human decisions or a system identifier (e.g. `operaton`, `dmn-engine`) for automated ones. */
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
  /** A stable key for the income the warning concerns (benefit/incomeType) — the dedup key. Derived from the message when omitted. */
  sourceKey?: string;
}

/** An EB income warning the caseworker can acknowledge or close. */
export interface Warning {
  /** The warning id */
  id?: string;
  /** The warning type */
  type?: WarningTypeEnum;
  /** A stable key for the income the warning concerns (benefit/incomeType) — the dedup key */
  sourceKey?: string;
  /** Human-readable warning text */
  message?: string;
  /** The warning status */
  status?: WarningStatusEnum;
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

/** What a caseworker sends to add or patch a person row (identity + caseworker-writable fields only). */
export interface NormPersonInput {
  /** The party id of the household member */
  partyId?: string;
  /** The role of the household member */
  role?: NormPersonInputRoleEnum;
  /** The name of the household member */
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
  /** The norm interval applied to the member */
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
   * The FC income-type id
   * @format int32
   */
  typeId?: number;
  /** The FC income-type name */
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

/** One income row of the calculation draft (FC income type with applicant/co-applicant sides, process vs caseworker amounts). */
export interface NormIncomeRow {
  /** The row id */
  id?: string;
  /** Who created the row: the process or a caseworker */
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
  /** The cost type */
  costType?: string;
  /** Which Lifecare bucket the expense posts to */
  bucket?: NormExpenseInputBucketEnum;
  /** The other sub-type (when the cost type is 'other') */
  otherSubType?: string;
  /** The cost specification */
  specification?: string;
  /** The amount applied for (ansökt). Honoured only when creating a new row; ignored on a patch. */
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
   * Month (1-12) the suggested application concerns. Null for a new application (new application), which has no prior period.
   * @format int32
   */
  periodMonth?: number;
  /**
   * Year the suggested application concerns. Null for a new application (new application).
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
  /** True when the applicant has an EB footprint in Lifecare (actualisation/decision/calculation) */
  existsInLc?: boolean;
  /** Whether the requested marital status (alone vs with a partner) matches the previous application. Null when not evaluated (no existing case). */
  maritalStatusMatches?: boolean;
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
  /** True when Lifecare shows a previous calculation */
  hasPreviousCalculation?: boolean;
  /** True when the Lifecare lookup succeeded. False means the answer is degraded (CM-only). */
  lifecareChecked?: boolean;
  /** True when the request included a co-applicant (co-applicant) */
  hasCoApplicant?: boolean;
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
  /** The id of the caremanagement errand the calculation concerns. When present, a Decision(RECOMMENDATION) summarising the income warnings is recorded on the errand for the caseworker to review; when omitted, the calculation is built without recording a recommendation. */
  errandId?: string;
  /** The incomes classified by the operaton rules (the evaluate-income-rules worker output), as JSON. When present, caremanagement maps these to FC income rows instead of fetching SSBTEK and evaluating the raw list itself. */
  classifiedIncomes?: string;
  /** The unhandled-income warnings from the operaton rules, recorded on the errand recommendation */
  unhandledIncomes?: string[];
  /** The period-over-period change warnings from the operaton rules, recorded on the errand recommendation */
  changeWarnings?: string[];
}

/** The created Lifecare calculation id plus the income warnings to review. */
export interface CalculationResponse {
  /**
   * The id of the calculation created in Lifecare FC
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
   * The id of the actualisation created in Lifecare FC
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

export interface UpdateJournalEntry {
  /**
   * Journal entry type (Lifecare 'Typ'/Journaltyp)
   * @minLength 0
   * @maxLength 255
   * @example "Journalfört meddelande"
   */
  type: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @minLength 0
   * @maxLength 255
   * @example "Journalfört meddelande: 2025-05-30 Info"
   */
  heading: string;
  /**
   * Free-text body of the journal entry; optional
   * @minLength 0
   * @maxLength 1048576
   * @example "Hej! Vill bara informera att jag fått jobb på Mejeriet."
   */
  text?: string;
  /**
   * Documented date (Lifecare 'Datum')
   * @format date
   * @example "2025-05-30"
   */
  entryDate: string;
  /**
   * Documented time (Lifecare 'Tid'); optional
   * @example "14:30"
   */
  entryTime?: string;
  /**
   * User id of the editor (Lifecare 'Ändrat av'); optional
   * @minLength 0
   * @maxLength 64
   * @example "ebb14eri"
   */
  modifiedBy?: string;
}

export interface UpdateDocument {
  /**
   * Document type (Lifecare 'Typ'/Dokumenttyp)
   * @minLength 0
   * @maxLength 255
   * @example "Brev"
   */
  type: string;
  /**
   * Heading (Lifecare 'Rubrik')
   * @minLength 0
   * @maxLength 255
   * @example "Beslut om ekonomiskt bistånd 2025-05"
   */
  heading: string;
  /**
   * Free-text body of the document; optional
   * @minLength 0
   * @maxLength 1048576
   * @example "Beslut har fattats enligt nedan ..."
   */
  text?: string;
  /**
   * Documented date (Lifecare 'Datum')
   * @format date
   * @example "2025-05-30"
   */
  documentDate: string;
  /**
   * Documented time (Lifecare 'Tid'); optional
   * @example "14:30"
   */
  documentTime?: string;
  /**
   * User id of the editor (Lifecare 'Ändrat av'); optional
   * @minLength 0
   * @maxLength 64
   * @example "ebb14eri"
   */
  modifiedBy?: string;
}

/** Set the approval state of an EB view section. */
export interface SectionApprovalRequest {
  /** Whether the section is approved (true) or its approval withdrawn (false) */
  approved: boolean;
  /** The caseworker approving the section (stored when approving, ignored when withdrawing) */
  approvedBy?: string;
}

/** A caseworker's approval of one section of the EB view (calculation / payment / decision). */
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
   * The selected FC norm id (Norm)
   * @format int32
   */
  normId?: number;
  /** The norm type */
  normType?: NormHeaderInputNormTypeEnum;
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

export interface ErrandEvent {
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
  /** Where the file came from: APPLICATION (citizen's application files), CONVERSATION (sent in a message thread), GENERATED (a consolidated PDF produced by the platform), ERRAND (uploaded directly to the errand), CASE_DATA (ärendeuppgifter — a case-data document for the errand) or MESSAGE_HISTORY (meddelandehistorik — the archived conversation PDF for a closed errand) */
  origin?: AttachmentOriginEnum;
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
  /**
   * The type code
   * @example "JOURNALED_MESSAGE"
   */
  code?: string;
  /**
   * Human-readable Swedish label (the Lifecare 'Typ' value)
   * @example "Journalfört meddelande"
   */
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
  /** The typed financial assistance application payload */
  data?: FinancialAssistanceData;
  /** The most recent automated recommendation on the errand (the latest RECOMMENDATION decision the caseworker reviews), or null when none has been produced. Carries the recommended value and, when the pipeline has computed it, the recommended amount/period to prefill the Decision form. */
  recommendation?: Decision;
  /** The caseworker approval state of the three EB view sections (calculation, payment, decision) — whether each has been verified as approved. Always present with all three sections. */
  sectionApprovals?: SectionApprovals;
}

/** The caseworker approval state of the three EB view sections (calculation, payment, decision). */
export interface SectionApprovals {
  /** Approval of the calculation (calculation) section */
  calculation?: SectionApproval;
  /** Approval of the payment (payment) section */
  payment?: SectionApproval;
  /** Approval of the decision (decision) section */
  decision?: SectionApproval;
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

/** EB type catalogue for the frontend dropdowns: income and cost types with labels, groups and the citizen flag. */
export interface FinancialAssistanceMetadata {
  /** The income types (inkomster) */
  incomeTypes?: TypeOption[];
  /** The cost types (kostnader), grouped by their Mina-sidor form section */
  costTypes?: TypeOption[];
}

/** A selectable EB income/cost type — the payload code plus its Mina-sidor + Lifecare labels, form group and citizen flag. */
export interface TypeOption {
  /** The type code, as stored on the payload (incomeType / costType) */
  code?: string;
  /** The citizen Mina-sidor label; null for handläggare-only types not on the citizen form */
  externalDisplayName?: string;
  /** The matching Lifecare handläggare-dropdown label, or null when there is no Lifecare counterpart */
  internalDisplayName?: string;
  /** Stable code for the Mina-sidor form section the type is shown under; null for income */
  group?: TypeOptionGroupEnum;
  /** Whether the type is offered on the citizen Mina-sidor form */
  citizenReportable?: boolean;
}

/** Document metadata — the catalogue of selectable document types. */
export interface DocumentMetadata {
  /** Selectable document types */
  types?: DocumentType[];
}

/** A selectable document type — the code and the Swedish Lifecare label. */
export interface DocumentType {
  /**
   * The type code
   * @example "LETTER"
   */
  code?: string;
  /**
   * Human-readable Swedish label (the Lifecare 'Typ' value)
   * @example "Brev"
   */
  displayName?: string;
}

/** An allowed decision outcome (decision alternatives) for an errand type. */
export interface DecisionOption {
  /** The decision outcome code, stored on the Decision row's value */
  code?: string;
  /** Human-readable label for the outcome */
  displayName?: string;
  /** Whether the outcome carries a belopp — true for outcomes that grant an amount, false for ones that imply 0 (e.g. avslag) */
  carriesAmount?: boolean;
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

/** The norm type used for the calculation */
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
 * Skrivskydd status — WORKING is an editable arbetsanteckning, LOCKED is an upprättad handling
 * @example "WORKING"
 */
export enum JournalEntryStatusEnum {
  WORKING = "WORKING",
  LOCKED = "LOCKED",
}

/**
 * Skrivskydd status — WORKING is an editable draft, LOCKED is an upprättad handling
 * @example "WORKING"
 */
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

/** Where the file came from: APPLICATION (citizen's application files), CONVERSATION (sent in a message thread), GENERATED (a consolidated PDF produced by the platform), ERRAND (uploaded directly to the errand), CASE_DATA (ärendeuppgifter — a case-data document for the errand) or MESSAGE_HISTORY (meddelandehistorik — the archived conversation PDF for a closed errand) */
export enum AttachmentOriginEnum {
  APPLICATION = "APPLICATION",
  CONVERSATION = "CONVERSATION",
  GENERATED = "GENERATED",
  ERRAND = "ERRAND",
  CASE_DATA = "CASE_DATA",
  MESSAGE_HISTORY = "MESSAGE_HISTORY",
}

/** Who the file came from: CLIENT (applicant) or CASEWORKER (caseworker). May be null for files predating the distinction or with no clear sender. */
export enum AttachmentSenderRoleEnum {
  CLIENT = "CLIENT",
  CASEWORKER = "CASEWORKER",
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
  DOCUMENT_TYPE = "DOCUMENT_TYPE",
}

/** Lookup kind */
export enum CreateLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
  DOCUMENT_TYPE = "DOCUMENT_TYPE",
}

/** Only return attachments with this origin */
export enum ReadAttachmentsParamsOriginEnum {
  APPLICATION = "APPLICATION",
  CONVERSATION = "CONVERSATION",
  GENERATED = "GENERATED",
  ERRAND = "ERRAND",
  CASE_DATA = "CASE_DATA",
}

/** Only return attachments from this sender */
export enum ReadAttachmentsParamsSenderRoleEnum {
  CLIENT = "CLIENT",
  CASEWORKER = "CASEWORKER",
}

/** What the uploaded file is: ERRAND (a plain manual upload, the default) or CASE_DATA (ärendeuppgifter — a case-data document). Defaults to ERRAND when omitted. */
export enum CreateAttachmentParamsOriginEnum {
  ERRAND = "ERRAND",
  CASE_DATA = "CASE_DATA",
}

/** Lookup kind */
export enum ReadLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
  DOCUMENT_TYPE = "DOCUMENT_TYPE",
}

/** Lookup kind */
export enum DeleteLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
  DOCUMENT_TYPE = "DOCUMENT_TYPE",
}

/** Lookup kind */
export enum UpdateLookupParamsKindEnum {
  CATEGORY = "CATEGORY",
  STATUS = "STATUS",
  TYPE = "TYPE",
  ROLE = "ROLE",
  CONTACT_REASON = "CONTACT_REASON",
  JOURNAL_ENTRY_TYPE = "JOURNAL_ENTRY_TYPE",
  DOCUMENT_TYPE = "DOCUMENT_TYPE",
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
