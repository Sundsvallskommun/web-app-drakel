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

export enum UserRoleEnum {
  AppRead = "app_read",
  AppAdmin = "app_admin",
}
