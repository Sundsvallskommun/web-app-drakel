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

export interface Actualisation {
  id?: number;
  type?: string;
  name?: string;
  date?: string;
  reason?: string;
  regards?: string;
  fromWho?: string;
  caseworker?: string;
  organization?: string;
  status?: string;
  investigationId?: number;
  serviceId?: number;
  decisionId?: number;
}

export interface ActualisationsApiResponse {
  data: Actualisation[];
  message: string;
}

export interface SaveTemplateDto {
  /**
   * @minLength 1
   * @maxLength 255
   */
  identifier?: string;
  /** @maxLength 255 */
  name: string;
  /** @maxLength 1000 */
  description?: string;
  /** @maxLength 255 */
  code: string;
  kind: SaveTemplateDtoKindEnum;
  /** @maxLength 1048576 */
  content: string;
}

export interface AdminTemplate {
  identifier: string;
  version?: string;
  name: string;
  description?: string;
  code: string;
  kind: string;
}

export interface AdminTemplateDetail {
  content: string;
  identifier: string;
  version?: string;
  name: string;
  description?: string;
  code: string;
  kind: string;
}

export interface AdminTemplatesApiResponse {
  data: AdminTemplate[];
  message: string;
}

export interface AdminTemplateApiResponse {
  data: AdminTemplateDetail;
  message: string;
}

export interface Administrator {
  username?: string;
  displayName?: string;
  description?: string;
}

export interface AdministratorsApiResponse {
  data: Administrator[];
  message: string;
}

export interface ErrandCounts {
  notes: number;
  warnings: number;
  unreadMessages: number;
}

export interface ErrandCountsApiResponse {
  data: ErrandCounts;
  message: string;
}

export interface Decision {
  id?: string;
  decisionType?: string;
  value?: string;
  description?: string;
  amount?: number;
  decisionMessage?: string;
  decisionDate?: string;
  periodFrom?: string;
  periodTo?: string;
  createdBy?: string;
  created?: string;
}

export interface DecisionsApiResponse {
  data: Decision[];
  message: string;
}

export interface RecommendationApiResponse {
  data?: Decision;
  message: string;
}

export interface PreviousDecisionView {
  type?: string;
  reason?: string;
  coApplicant?: string;
  coApplicantReason?: string;
  periodFrom?: string;
  periodTo?: string;
  amount?: number;
  date?: string;
}

export interface DecisionProposalWarningView {
  id?: string;
  type?: string;
  typeDisplayName?: string;
  message?: string;
  status?: string;
}

export interface DecisionProposalView {
  outcome?: string;
  outcomeOptions?: string[];
  periodFrom?: string;
  periodTo?: string;
  concernedMonth?: string;
  estimatedAmount?: number;
  normSum?: number;
  incomeSum?: number;
  expenseSum?: number;
  specialExpenseSum?: number;
  explanation?: string;
  reason?: string;
  coApplicantReason?: string;
  reasonOptions?: string[];
  phraseText?: string;
  previousDecision?: PreviousDecisionView;
  warnings?: DecisionProposalWarningView[];
}

export interface DecisionProposalApiResponse {
  data: DecisionProposalView;
  message: string;
}

export interface LifecareDecisionView {
  id: number;
  decisionCode: number;
  outcome?: string;
  date: string;
  periodFrom?: string;
  periodTo?: string;
  amount: number;
  reasonCode?: number;
  reason?: string;
  message?: string;
  locked: boolean;
  decisionMaker: string;
}

export interface LifecareDecisionApiResponse {
  data?: LifecareDecisionView;
  message: string;
}

export interface LifecareDecisionTypeView {
  code: number;
  name: string;
  outcome?: string;
  requiresFromDate: boolean;
  requiresToDate: boolean;
}

export interface LifecareDecisionTypesApiResponse {
  data: LifecareDecisionTypeView[];
  message: string;
}

export interface LifecareDecisionReasonView {
  code: number;
  name: string;
  header: string;
}

export interface LifecareDecisionReasonsApiResponse {
  data: LifecareDecisionReasonView[];
  message: string;
}

export interface LifecareDecisionPdfApiResponse {
  data: string;
  message: string;
}

export interface DigitalMailboxStatus {
  available: boolean;
}

export interface DigitalMailboxApiResponse {
  data: DigitalMailboxStatus;
  message: string;
}

export interface CreateDocumentDto {
  /** @maxLength 255 */
  type: string;
  /** @maxLength 255 */
  heading: string;
  /** @maxLength 1048576 */
  text?: string;
  documentDateTime: string;
}

export interface UpdateDocumentDto {
  /** @maxLength 255 */
  type: string;
  /** @maxLength 255 */
  heading: string;
  /** @maxLength 1048576 */
  text?: string;
  documentDateTime: string;
}

export interface Document {
  id?: string;
  errandId?: string;
  source?: string;
  lifecareId?: string;
  type?: string;
  heading?: string;
  text?: string;
  documentDateTime?: string;
  status?: string;
  createdBy?: string;
  created?: string;
  modifiedBy?: string;
  modified?: string;
  lockedBy?: string;
  locked?: string;
}

export interface DocumentType {
  code?: string;
  displayName?: string;
}

export interface DocumentsApiResponse {
  data: Document[];
  message: string;
}

export interface DocumentApiResponse {
  data: Document;
  message: string;
}

export interface DocumentTypesApiResponse {
  data: DocumentType[];
  message: string;
}

export interface DocumentTemplateOption {
  identifier?: string;
  name?: string;
}

export interface DocumentTemplates {
  documents: DocumentTemplateOption[];
  phrases: DocumentTemplateOption[];
}

export interface DocumentTemplateContent {
  content: string;
}

export interface DocumentTemplatesApiResponse {
  data: DocumentTemplates;
  message: string;
}

export interface DocumentTemplateContentApiResponse {
  data: DocumentTemplateContent;
  message: string;
}

export interface ExternalTag {
  key?: string;
  value?: string;
}

export interface ContactChannel {
  key?: string;
  value?: string;
}

export interface StakeholderParameter {
  id?: number;
  displayName?: string;
  key?: string;
  values?: string[];
}

export interface Stakeholder {
  id?: string;
  externalId?: string;
  externalIdType?: string;
  personalNumber?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  address?: string;
  careOf?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  contactChannels?: ContactChannel[];
  parameters?: StakeholderParameter[];
}

export interface Parameter {
  id?: string;
  displayName?: string;
  parameterGroup?: string;
  key?: string;
  values?: string[];
}

export interface Errand {
  id?: string;
  errandNumber?: string;
  municipalityId?: string;
  namespace?: string;
  title?: string;
  category?: string;
  type?: string;
  typeSlug?: string;
  status?: string;
  description?: string;
  priority?: string;
  reporterUserId?: string;
  assignedUserId?: string;
  contactReason?: string;
  contactReasonDescription?: string;
  externalTags?: ExternalTag[];
  stakeholders?: Stakeholder[];
  parameters?: Parameter[];
  created?: string;
  modified?: string;
  touched?: string;
  applicantName?: string;
  coApplicantName?: string;
}

export interface PagingAndSortingMetaData {
  page?: number;
  limit?: number;
  count?: number;
  totalRecords?: number;
  totalPages?: number;
  sortBy?: string[];
  sortDirection?: string;
}

export interface FindErrandsResult {
  errands?: Errand[];
  _meta?: PagingAndSortingMetaData;
}

export interface ErrandApiResponse {
  data: Errand;
  message: string;
}

export interface ErrandsApiResponse {
  data: FindErrandsResult;
  message: string;
}

export interface PatchErrandDto {
  /** @maxLength 255 */
  title?: string;
  category?: string;
  type?: string;
  /** @maxLength 64 */
  status?: string;
  description?: string;
  /** @maxLength 16 */
  priority?: string;
  /** @maxLength 64 */
  reporterUserId?: string;
  /** @maxLength 64 */
  assignedUserId?: string;
  contactReason?: string;
  contactReasonDescription?: string;
  externalTags?: ExternalTag[];
}

export interface CreateErrandDto {
  /** @maxLength 64 */
  typeSlug: string;
  /** @maxLength 255 */
  title?: string;
  category?: string;
  type?: string;
  /** @maxLength 64 */
  status?: string;
  description?: string;
  /** @maxLength 16 */
  priority?: string;
  /** @maxLength 64 */
  reporterUserId?: string;
  /** @maxLength 64 */
  assignedUserId?: string;
  contactReason?: string;
  contactReasonDescription?: string;
  externalTags?: ExternalTag[];
}

export interface FindErrandsQueryDto {
  filter?: string;
  /** @min 0 */
  page?: number;
  /** @min 1 */
  size?: number;
  sort?: string[];
  hasUnacknowledgedNotifications?: boolean;
  hasUnhandledNotifications?: boolean;
  notificationOwnerId?: string;
}

export interface Attachment {
  id?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  created?: string;
  modified?: string;
  documentType?: string;
  senderRole?: string;
  messageId?: string;
}

export interface AttachmentsApiResponse {
  data: Attachment[];
  message: string;
}

export interface StakeholdersApiResponse {
  data: Stakeholder[];
  message: string;
}

export interface ErrandEvent {
  id?: string;
  errandId?: string;
  source?: string;
  action?: string;
  target?: string;
  description?: string;
  httpMethod?: string;
  requestPath?: string;
  actor?: string;
  actorType?: string;
  statusCode?: number;
  created?: string;
}

export interface ActorEventLog {
  events: ErrandEvent[];
  total: number;
}

export interface ActorEventLogApiResponse {
  data: ActorEventLog;
  message: string;
}

export interface ErrandEventsApiResponse {
  data: ErrandEvent[];
  message: string;
}

export interface DecisionNotificationDto {
  minaSidor?: boolean;
  digitalBrevlada?: boolean;
  brev?: boolean;
}

export interface DecisionRegistration {
  decisionId: string;
  outcome: DecisionRegistrationOutcomeEnum;
  lifecareId?: string;
  detail?: string;
}

export interface FinalizeResult {
  decisionId?: string;
  processMessageCorrelated: boolean;
  lifecareDecision?: DecisionRegistration;
  failedChannels: string[];
}

export interface FinalizeApiResponse {
  data: FinalizeResult;
  message: string;
}

export interface FormSnapshotAnswer {
  code?: string;
  value?: string;
  display?: string;
}

export interface FormSnapshotOption {
  code?: string;
  label?: string;
  selected?: boolean;
}

export interface FormSnapshotNotice {
  level?: string;
  text?: string;
}

export interface FormSnapshotField {
  name?: string;
  label?: string;
  inputType?: string;
  helpText?: string;
  infoTexts?: string[];
  notices?: FormSnapshotNotice[];
  options?: FormSnapshotOption[];
  answer?: FormSnapshotAnswer;
  items?: FormSnapshotGroup[];
  required?: boolean;
  visible?: boolean;
  condition?: string;
}

export interface FormSnapshotGroup {
  fields?: FormSnapshotField[];
}

export interface FormSnapshotSection {
  id?: string;
  title?: string;
  description?: string;
  visible?: boolean;
  fields?: FormSnapshotField[];
}

export interface FormSnapshotAttestation {
  label?: string;
  answer?: FormSnapshotAnswer;
}

export interface FormSnapshot {
  schemaVersion: string;
  formDefinitionVersion?: string;
  typeSlug?: string;
  locale?: string;
  capturedAt?: string;
  title?: string;
  sections: FormSnapshotSection[];
  attestation?: FormSnapshotAttestation;
}

export interface FormSnapshotApiResponse {
  data: FormSnapshot;
  message: string;
}

export interface JobStimulusPeriod {
  id?: number;
  role?: string;
  fromDate?: string;
  toDate?: string;
}

export interface JobStimulusPeriodsApiResponse {
  data: JobStimulusPeriod[];
  message: string;
}

export interface AddJobStimulusPeriodDto {
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  fromDate: string;
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  toDate?: string;
}

export interface CreateJournalEntryDto {
  /** @maxLength 255 */
  type: string;
  /** @maxLength 255 */
  heading: string;
  /** @maxLength 1048576 */
  text?: string;
  entryDateTime: string;
}

export interface UpdateJournalEntryDto {
  /** @maxLength 255 */
  type: string;
  /** @maxLength 255 */
  heading: string;
  /** @maxLength 1048576 */
  text?: string;
  entryDateTime: string;
}

export interface JournalEntry {
  id?: string;
  errandId?: string;
  source?: string;
  lifecareId?: string;
  type?: string;
  heading?: string;
  text?: string;
  entryDateTime?: string;
  status?: string;
  createdBy?: string;
  created?: string;
  updated?: string;
}

export interface JournalEntryType {
  code?: string;
  displayName?: string;
}

export interface JournalEntriesApiResponse {
  data: JournalEntry[];
  message: string;
}

export interface JournalEntryApiResponse {
  data: JournalEntry;
  message: string;
}

export interface JournalEntryTypesApiResponse {
  data: JournalEntryType[];
  message: string;
}

export interface LifecareCalculationSummaryView {
  income: number;
  jobStimulus: number;
  jobStimulusDeduction: number;
  norm: number;
  familyCost: number;
  commonHouseholdCost: number;
  expenses: number;
  sum: number;
  specialExpenses: number;
  result: number;
}

export interface LifecareCalculationView {
  id: number;
  normName?: string;
  date: string;
  startDate: string;
  endDate: string;
  finalized: boolean;
  updated: string;
  summary?: LifecareCalculationSummaryView;
}

export interface LifecareCalculationApiResponse {
  data?: LifecareCalculationView;
  message: string;
}

export interface SaveLifecareCalculationDto {
  finalize?: boolean;
}

export interface SaveLifecareDecisionDto {
  decisionCode: number;
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  date?: string;
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  periodFrom?: string;
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  periodTo?: string;
  amount?: number;
  reasonCode?: number;
  /** @maxLength 1048576 */
  decisionMessage?: string;
}

export interface LifecareDocumentTypeView {
  code: number;
  name: string;
  canChangeOccurenceDate: boolean;
  protectedByDefault: boolean;
}

export interface LifecareDocumentTypesApiResponse {
  data: LifecareDocumentTypeView[];
  message: string;
}

export interface LifecareRecordView {
  id: string;
  category: string;
  title: string;
  dateTime: string;
  type: string;
  ownerTypeText: string;
  responsibleCaseworker?: string;
  modifiedBy: string;
  locked: boolean;
  protected: boolean;
}

export interface LifecareRecordsView {
  journalNotes: LifecareRecordView[];
  documents: LifecareRecordView[];
}

export interface LifecareRecordsApiResponse {
  data: LifecareRecordsView;
  message: string;
}

export interface LifecareRecordContentView {
  id: string;
  category: string;
  title: string;
  content: string;
  occurenceDate: string;
  time: string;
  editable: boolean;
}

export interface LifecareRecordApiResponse {
  data: LifecareRecordView;
  message: string;
}

export interface LifecareRecordContentApiResponse {
  data: LifecareRecordContentView;
  message: string;
}

export interface LifecareRecordBodyView {
  id: string;
  content?: string;
}

export interface LifecareRecordBodiesApiResponse {
  data: LifecareRecordBodyView[];
  message: string;
}

export interface LifecareNoteTypeView {
  code: number;
  name: string;
  protectedByDefault: boolean;
}

export interface LifecareNoteTypesApiResponse {
  data: LifecareNoteTypeView[];
  message: string;
}

export interface UpdateLifecareRecordDto {
  /** @maxLength 1048576 */
  content: string;
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  occurenceDate?: string;
  /** @pattern ^\d{2}:\d{2}$ */
  time?: string;
  protected?: boolean;
}

export interface CreateLifecareJournalNoteDto {
  /**
   * @minLength 1
   * @maxLength 1048576
   */
  content: string;
  noteTypeCode: number;
  /** @maxLength 255 */
  title?: string;
  /** @pattern ^\d{2}:\d{2}$ */
  occurenceTime?: string;
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  occurenceDate?: string;
  protected?: boolean;
}

export interface CreateLifecareDocumentDto {
  /**
   * @minLength 1
   * @maxLength 1048576
   */
  content: string;
  documentTypeCode: number;
  /** @maxLength 255 */
  title?: string;
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  occurenceDate?: string;
  protected?: boolean;
}

export interface FindHouseholdCandidatesDto {
  /** @minLength 2 */
  filter: string;
}

export interface HouseholdPersonDto {
  personId: string;
}

export interface HouseholdPersonView {
  personId: string;
  personalNumber: string;
  name: string;
  relation?: string;
  bonusChild: boolean;
  inCalculation: boolean;
}

export interface LifecareHouseholdView {
  persons: HouseholdPersonView[];
}

export interface LifecareHouseholdApiResponse {
  data: LifecareHouseholdView;
  message: string;
}

export interface HouseholdCandidateView {
  personId: string;
  personalNumber: string;
  name: string;
}

export interface HouseholdCandidatesApiResponse {
  data: HouseholdCandidateView[];
  message: string;
}

export interface LifecarePaymentMethodView {
  code: number;
  name: string;
  localNumberEnabled: boolean;
  localNumberMandatory: boolean;
}

export interface LifecarePayeeView {
  id: number;
  label: string;
  name: string;
  paymentMethodCode: number;
  paymentMethod: string;
  clearing: string;
  accountNumber: string;
  streetAddress: string;
  careOfAddress: string;
  postalCode: string;
  postalAddress: string;
  toRegisteredAddress: boolean;
}

export interface LifecarePostingView {
  purpose: number;
  text: string;
}

export interface LifecareBalanceView {
  name: string;
  approvedAmount: number;
  bookedAmount: number;
  balanceAmount: number;
}

export interface LifecareConcernMonthView {
  month: string;
  label: string;
}

export interface LifecarePaymentProposalView {
  paymentDate?: string;
  concernedMonth?: string;
  amount?: number;
  payeeId?: number;
}

export interface LifecarePaymentOptionsView {
  paymentMethods: LifecarePaymentMethodView[];
  payees: LifecarePayeeView[];
  postings: LifecarePostingView[];
  balances: LifecareBalanceView[];
  concernMonths: LifecareConcernMonthView[];
  proposal: LifecarePaymentProposalView;
}

export interface LifecarePaymentOptionsApiResponse {
  data: LifecarePaymentOptionsView;
  message: string;
}

export interface LifecarePayeeApiResponse {
  data?: LifecarePayeeView;
  message: string;
}

export interface LifecareRegisteredPaymentView {
  id: number;
  payDate: string;
  concernedMonth: string;
  amount: number;
  paymentMethod: string;
  recipient: string;
  status: string;
  cancelled: boolean;
}

export interface LifecareRegisteredPaymentsApiResponse {
  data: LifecareRegisteredPaymentView[];
  message: string;
}

export interface CreateLifecarePayeeDto {
  /**
   * @minLength 1
   * @maxLength 255
   */
  name: string;
  /** @maxLength 255 */
  payeeName?: string;
  paymentMethod: number;
  /** @maxLength 16 */
  clearing?: string;
  /** @maxLength 64 */
  accountNumber?: string;
}

export interface PaymentInputDto {
  paymentDate?: string;
  amount?: number;
  applicationMonth?: string;
  paymentMethod?: string;
  payeeName?: string;
  payeeAddress?: string;
  payeeCareOf?: string;
  payeeZipCode?: string;
  payeeCity?: string;
  clearingNumber?: string;
  accountNumber?: string;
  accountingCode?: string;
  localPaymentNumber?: string;
  invoiceNumber?: string;
  usesOcr?: boolean;
  messageLines?: string[];
}

export interface LifecarePaymentCreated {
  lifecareId: string;
}

export interface LifecarePaymentCreatedApiResponse {
  data: LifecarePaymentCreated;
  message: string;
}

export interface PaymentStatusView {
  applicationMonth?: string;
  effectuated: boolean;
  paymentDate?: string;
  amount?: number;
  status?: string;
  unavailable: boolean;
}

export interface PaymentStatusApiResponse {
  data: PaymentStatusView;
  message: string;
}

export interface LifecareReminderView {
  id: number;
  date: string;
  status: string;
  statusCode: number;
  priority: string;
  priorityCode: number;
  type: string;
  objectType: string;
  text: string;
  caseworker: string;
  caseworkerId: string;
}

export interface LifecareRemindersApiResponse {
  data: LifecareReminderView[];
  message: string;
}

export interface LifecareReminderChoiceView {
  code: number;
  text: string;
}

export interface LifecareReminderOptionsView {
  priorities: LifecareReminderChoiceView[];
  statuses: LifecareReminderChoiceView[];
  defaultPriority: number;
  defaultStatus: number;
}

export interface LifecareReminderOptionsApiResponse {
  data: LifecareReminderOptionsView;
  message: string;
}

export interface CreateLifecareReminderDto {
  /** @pattern ^\d{4}-\d{2}-\d{2}$ */
  reminderDate: string;
  /**
   * @minLength 1
   * @maxLength 4000
   */
  text: string;
  priority: number;
  status: number;
}

export interface LifecareSectionStatusView {
  calculationFinalized: boolean;
  decisionSaved: boolean;
  paymentRegistered: boolean;
}

export interface LifecareSectionStatusApiResponse {
  data: LifecareSectionStatusView;
  message: string;
}

export interface MessageAttachment {
  id?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  created?: string;
  senderRole?: string;
}

export interface Message {
  id?: string;
  errandId?: string;
  direction?: string;
  body?: string;
  author?: string;
  inReplyToId?: string;
  created?: string;
  attachments?: MessageAttachment[];
}

export interface MessagesApiResponse {
  data: Message[];
  message: string;
}

export interface Lookup {
  name?: string;
  displayName?: string;
  created?: string;
  modified?: string;
}

export interface LookupsApiResponse {
  data: Lookup[];
  message: string;
}

export interface PreviousCalculationPerson {
  name?: string;
  amount?: number;
  deviationFromDate?: string;
  deviationToDate?: string;
}

export interface PreviousCalculationIncome {
  type?: string;
  amountApplicant?: number;
  applicantSearchDate?: string;
  amountCoApplicant?: number;
  coApplicantSearchDate?: string;
}

export interface PreviousCalculationExpense {
  type?: string;
  appliedAmount?: number;
  approvedAmount?: number;
}

export interface PreviousCalculationView {
  id?: number;
  norm?: string;
  fromDate?: string;
  toDate?: string;
  incomeSum?: number;
  expenseSum?: number;
  specialExpenseSum?: number;
  normSum?: number;
  commonHouseholdCost?: number;
  familyCost?: number;
  balance?: number;
  totalSum?: number;
  isFinal?: boolean;
  persons?: PreviousCalculationPerson[];
  incomes?: PreviousCalculationIncome[];
  expenses?: PreviousCalculationExpense[];
  specialExpenses?: PreviousCalculationExpense[];
}

export interface PreviousCalculationApiResponse {
  data?: PreviousCalculationView;
  message: string;
}

export interface NormRowInputDto {
  typeId?: number;
  typeName?: string;
  applicantCaseworkerAmount?: number;
  applicantAmountDate?: string;
  coapplicantCaseworkerAmount?: number;
  coapplicantAmountDate?: string;
  costType?: string;
  bucket?: string;
  otherSubType?: string;
  specification?: string;
  caseworkerAmount?: number;
  appliedAmount?: number;
  partyId?: string;
  role?: string;
  name?: string;
  caseworkerDays?: number;
  included?: boolean;
  deviationFromDate?: string;
  deviationToDate?: string;
  normInterval?: string;
  jobStimulusAmount?: number;
  note?: string;
}

export interface NormHeaderInputDto {
  normId?: number;
  normType?: string[];
  calculationFromDate?: string;
  calculationToDate?: string;
  calculationDate?: string;
  hasCustomHouseholdSize?: boolean;
  householdSize?: number;
}

export interface NormPersonRow {
  id?: string;
  position?: number;
  origin?: string;
  partyId?: string;
  personalNumber?: string;
  role?: string;
  roleDisplayName?: string;
  name?: string;
  processDays?: number;
  caseworkerDays?: number;
  effectiveDays?: number;
  included?: boolean;
  deviationFromDate?: string;
  deviationToDate?: string;
  normInterval?: string;
  amount?: number;
  jobStimulusAmount?: number;
  deleted?: boolean;
  note?: string;
}

export interface NormIncomeRow {
  id?: string;
  position?: number;
  origin?: string;
  typeId?: number;
  typeName?: string;
  applicantProcessAmount?: number;
  applicantCaseworkerAmount?: number;
  applicantEffectiveAmount?: number;
  applicantAmountDate?: string;
  coapplicantProcessAmount?: number;
  coapplicantCaseworkerAmount?: number;
  coapplicantEffectiveAmount?: number;
  coapplicantAmountDate?: string;
  deleted?: boolean;
  note?: string;
}

export interface NormExpenseRow {
  id?: string;
  position?: number;
  origin?: string;
  bucket?: string;
  costType?: string;
  costTypeDisplayName?: string;
  otherSubType?: string;
  specification?: string;
  appliedAmount?: number;
  processAmount?: number;
  caseworkerAmount?: number;
  effectiveAmount?: number;
  deleted?: boolean;
  note?: string;
}

export interface NormberakningDraft {
  errandId?: string;
  applicationMonth?: string;
  normId?: number;
  normType?: string[];
  normTypeDisplayNames?: string[];
  calculationFromDate?: string;
  calculationToDate?: string;
  calculationDate?: string;
  hasCustomHouseholdSize?: boolean;
  householdSize?: number;
  persons?: NormPersonRow[];
  incomes?: NormIncomeRow[];
  expenses?: NormExpenseRow[];
  specialExpenses?: NormExpenseRow[];
  incomeSum?: number;
  expenseSum?: number;
  specialExpenseSum?: number;
  created?: string;
  updated?: string;
  source?: NormberakningDraftSourceEnum;
  finalized?: boolean;
}

export interface NormTypeOption {
  code?: string;
  displayName?: string;
}

export interface NormberakningTypes {
  incomeTypes: NormTypeOption[];
  costTypes: NormTypeOption[];
  livingCostTypes: NormTypeOption[];
}

export interface NormberakningTypesApiResponse {
  data: NormberakningTypes;
  message: string;
}

export interface NormberakningDraftApiResponse {
  data: NormberakningDraft;
  message: string;
}

export interface CreateNoteDto {
  /**
   * @minLength 1
   * @maxLength 8192
   */
  body: string;
}

export interface UpdateNoteDto {
  /**
   * @minLength 1
   * @maxLength 8192
   */
  body: string;
}

export interface UpdateNotificationDto {
  acknowledged?: boolean;
  handled?: boolean;
}

export interface ErrandNotification {
  id?: string;
  errandId?: string;
  ownerId?: string;
  createdBy?: string;
  type?: string;
  subType?: string;
  description?: string;
  content?: string;
  acknowledged?: boolean;
  handled?: boolean;
  created?: string;
  modified?: string;
}

export interface ErrandNotificationsApiResponse {
  data: ErrandNotification[];
  message: string;
}

export interface ErrandNotificationApiResponse {
  data: ErrandNotification;
  message: string;
}

export interface RenderPdfDto {
  /** @minLength 1 */
  html: string;
}

export interface PermissionsResponse {
  canEditErrands: boolean;
  canManageTemplates: boolean;
  canViewEventLog: boolean;
}

export interface User {
  name: string;
  username: string;
  role: UserRoleEnum;
  permissions: PermissionsResponse;
}

export interface UserApiResponse {
  data: User;
  message: string;
}

export interface UpdateWarningStatusDto {
  status: UpdateWarningStatusDtoStatusEnum;
}

export interface Warning {
  id?: string;
  type?: string;
  typeDisplayName?: string;
  section?: string;
  sourceKey?: string;
  message?: string;
  status?: string;
  statusDisplayName?: string;
  autoResolved?: boolean;
  created?: string;
  updated?: string;
}

export interface WarningsApiResponse {
  data: Warning[];
  message: string;
}

export enum SaveTemplateDtoKindEnum {
  DOCUMENT = "DOCUMENT",
  PHRASE = "PHRASE",
}

export enum DecisionRegistrationOutcomeEnum {
  REGISTERED = "REGISTERED",
  FAILED = "FAILED",
  NOT_SENT = "NOT_SENT",
}

export enum NormberakningDraftSourceEnum {
  CAREM = "CAREM",
  LIFECARE = "LIFECARE",
}

export enum UserRoleEnum {
  AppRead = "app_read",
  AppAdmin = "app_admin",
  AppSuperadmin = "app_superadmin",
}

export enum UpdateWarningStatusDtoStatusEnum {
  OPEN = "OPEN",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  CLOSED = "CLOSED",
}
