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

export interface BevakningInputDto {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

export interface Bevakning {
  id?: string;
  source?: string;
  lifecareId?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  created?: string;
  updated?: string;
}

export interface BevakningarApiResponse {
  data: Bevakning[];
  message: string;
}

export interface BevakningApiResponse {
  data: Bevakning;
  message: string;
}

export interface ErrandCounts {
  notes: number;
  warnings: number;
  bevakningar: number;
  unreadMessages: number;
}

export interface ErrandCountsApiResponse {
  data: ErrandCounts;
  message: string;
}

export interface CreateDecisionDto {
  decisionType?: string;
  value: string;
  amount?: number;
  decisionDate?: string;
  periodFrom?: string;
  periodTo?: string;
  decisionMessage?: string;
  description?: string;
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

export interface DecisionOption {
  code?: string;
  displayName?: string;
  carriesAmount?: boolean;
}

export interface DecisionsApiResponse {
  data: Decision[];
  message: string;
}

export interface DecisionApiResponse {
  data: Decision;
  message: string;
}

export interface DecisionOptionsApiResponse {
  data: DecisionOption[];
  message: string;
}

export interface RecommendationApiResponse {
  data?: Decision;
  message: string;
}

export interface CreateDocumentDto {
  type: string;
  heading: string;
  text?: string;
  documentDate: string;
  documentTime?: string;
}

export interface UpdateDocumentDto {
  type: string;
  heading: string;
  text?: string;
  documentDate: string;
  documentTime?: string;
}

export interface Document {
  id?: string;
  errandId?: string;
  type?: string;
  heading?: string;
  text?: string;
  documentDate?: string;
  documentTime?: string;
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
  title?: string;
  category?: string;
  type?: string;
  status?: string;
  description?: string;
  priority?: string;
  reporterUserId?: string;
  assignedUserId?: string;
  contactReason?: string;
  contactReasonDescription?: string;
  externalTags?: ExternalTag[];
}

export interface CreateErrandDto {
  typeSlug: string;
  title?: string;
  category?: string;
  type?: string;
  status?: string;
  description?: string;
  priority?: string;
  reporterUserId?: string;
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
}

export interface CreateStakeholderDto {
  role?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  externalId?: string;
  externalIdType?: string;
  contactChannels?: ContactChannel[];
}

export interface Attachment {
  id?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  created?: string;
  modified?: string;
  origin?: string;
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

export interface ErrandEventsApiResponse {
  data: ErrandEvent[];
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
  items?: FormSnapshotField[][];
  required?: boolean;
  visible?: boolean;
  condition?: string;
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

export interface CreateJournalEntryDto {
  type: string;
  heading: string;
  text?: string;
  entryDate: string;
  entryTime?: string;
}

export interface UpdateJournalEntryDto {
  type: string;
  heading: string;
  text?: string;
  entryDate: string;
  entryTime?: string;
}

export interface JournalEntry {
  id?: string;
  errandId?: string;
  type?: string;
  heading?: string;
  text?: string;
  entryDate?: string;
  entryTime?: string;
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
  normType?: string;
  calculationFromDate?: string;
  calculationToDate?: string;
  calculationDate?: string;
  hasCustomHouseholdSize?: boolean;
  householdSize?: number;
}

export interface NormPersonRow {
  id?: string;
  origin?: string;
  partyId?: string;
  role?: string;
  name?: string;
  processDays?: number;
  caseworkerDays?: number;
  effectiveDays?: number;
  included?: boolean;
  deviationFromDate?: string;
  deviationToDate?: string;
  normInterval?: string;
  jobStimulusAmount?: number;
  deleted?: boolean;
  note?: string;
}

export interface NormIncomeRow {
  id?: string;
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
  origin?: string;
  bucket?: string;
  costType?: string;
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
  normType?: string;
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

export interface AcknowledgeNotificationDto {
  acknowledged: boolean;
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

export interface PaymentStatusView {
  applicationMonth?: string;
  effectuated: boolean;
  paymentDate?: string;
  unavailable: boolean;
}

export interface PaymentStatusApiResponse {
  data: PaymentStatusView;
  message: string;
}

export interface SetSectionApprovalDto {
  approved: boolean;
}

export interface SectionApproval {
  section?: string;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface SectionApprovals {
  calculation?: SectionApproval;
  payment?: SectionApproval;
  decision?: SectionApproval;
}

export interface SectionApprovalsApiResponse {
  data: SectionApprovals;
  message: string;
}

export interface SectionApprovalApiResponse {
  data: SectionApproval;
  message: string;
}

export interface PermissionsResponse {
  canEditErrands: boolean;
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
  sourceKey?: string;
  message?: string;
  status?: string;
  autoResolved?: boolean;
  created?: string;
  updated?: string;
}

export interface WarningsApiResponse {
  data: Warning[];
  message: string;
}

export enum UserRoleEnum {
  AppRead = "app_read",
  AppAdmin = "app_admin",
}

export enum UpdateWarningStatusDtoStatusEnum {
  OPEN = "OPEN",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  CLOSED = "CLOSED",
}
