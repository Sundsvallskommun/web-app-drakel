/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

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

/** ContactChannel model */
export interface ContactChannel {
  /** The key of the contact channel */
  key?: string;
  /** The value of the contact channel */
  value?: string;
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

/** Errand model */
export interface Errand {
  /** Unique identifier of the errand */
  id?: string;
  /** Municipality id */
  municipalityId?: string;
  /** Namespace */
  namespace?: string;
  /** Title for the errand */
  title?: string;
  /** Category for the errand */
  category?: string;
  /** Type for the errand */
  type?: string;
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
  /** Contact reason (name of a CONTACT_REASON lookup) */
  contactReason?: string;
  /** Contact reason description */
  contactReasonDescription?: string;
  /** External tags associated with the errand */
  externalTags?: ExternalTag[];
  /** Stakeholders associated with the errand */
  stakeholders?: Stakeholder[];
  /** Parameters for the errand */
  parameters?: Parameter[];
  /** Decisions recorded against the errand. Both system-generated (e.g. a DMN-evaluated recommendation from a BPMN process) and human (e.g. a handläggare APPROVE/REJECT) decisions accumulate here over the errand's lifetime, distinguished by `decisionType`. */
  decisions?: Decision[];
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

/** ExternalTag model */
export interface ExternalTag {
  /** The key of the external tag */
  key?: string;
  /** The value of the external tag */
  value?: string;
}

/** Parameter model */
export interface Parameter {
  /** Unique identifier */
  id?: string;
  /** Display name of the parameter */
  displayName?: string;
  /** Grouping for the parameter */
  parameterGroup?: string;
  /** Key of the parameter */
  key?: string;
  /** Values of the parameter */
  values?: string[];
}

/** Stakeholder model */
export interface Stakeholder {
  /** Unique identifier */
  id?: string;
  /** External id for the stakeholder */
  externalId?: string;
  /** Type of external id */
  externalIdType?: string;
  /** Role of the stakeholder */
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
  /** Parameters for the stakeholder */
  parameters?: StakeholderParameter[];
}

/** StakeholderParameter model */
export interface StakeholderParameter {
  /**
   * Unique identifier
   * @format int64
   */
  id?: number;
  /** Display name of the parameter */
  displayName?: string;
  /** Key of the parameter */
  key?: string;
  /** Values of the parameter */
  values?: string[];
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

/** PatchErrand model - only patchable fields */
export interface PatchErrand {
  /** Title for the errand */
  title?: string;
  /** Category for the errand */
  category?: string;
  /** Type for the errand */
  type?: string;
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
  /** Contact reason (name of a CONTACT_REASON lookup) */
  contactReason?: string;
  /** Contact reason description */
  contactReasonDescription?: string;
  /** External tags associated with the errand */
  externalTags?: ExternalTag[];
}

export enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
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

/** Lookup kind */
export enum ReadLookupsParamsKindEnum {
  CATEGORY = 'CATEGORY',
  STATUS = 'STATUS',
  TYPE = 'TYPE',
  ROLE = 'ROLE',
  CONTACT_REASON = 'CONTACT_REASON',
}

/** Lookup kind */
export enum CreateLookupParamsKindEnum {
  CATEGORY = 'CATEGORY',
  STATUS = 'STATUS',
  TYPE = 'TYPE',
  ROLE = 'ROLE',
  CONTACT_REASON = 'CONTACT_REASON',
}

/** Lookup kind */
export enum ReadLookupParamsKindEnum {
  CATEGORY = 'CATEGORY',
  STATUS = 'STATUS',
  TYPE = 'TYPE',
  ROLE = 'ROLE',
  CONTACT_REASON = 'CONTACT_REASON',
}

/** Lookup kind */
export enum DeleteLookupParamsKindEnum {
  CATEGORY = 'CATEGORY',
  STATUS = 'STATUS',
  TYPE = 'TYPE',
  ROLE = 'ROLE',
  CONTACT_REASON = 'CONTACT_REASON',
}

/** Lookup kind */
export enum UpdateLookupParamsKindEnum {
  CATEGORY = 'CATEGORY',
  STATUS = 'STATUS',
  TYPE = 'TYPE',
  ROLE = 'ROLE',
  CONTACT_REASON = 'CONTACT_REASON',
}
