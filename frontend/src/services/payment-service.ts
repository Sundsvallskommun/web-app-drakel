import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * Whether the Lifecare utbetalning for an errand's application month has been effectuated. Defined
 * locally (like {@link Warning}) mirroring the backend response. `unavailable` is true when the status
 * could not be determined (missing applicant/month, or Lifecare did not respond).
 */
export interface PaymentStatus {
  applicationMonth?: string;
  effectuated: boolean;
  paymentDate?: string;
  unavailable: boolean;
}

/** Fetches the Lifecare utbetalning status for an errand. */
export const getPaymentStatus = (errandId: string): Promise<ServiceResponse<PaymentStatus>> =>
  apiService
    .get<ApiResponse<PaymentStatus>>(`errands/${errandId}/payment-status`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * The utbetalningsförslag behind the Utbetalning tab. caremanagement derives it on every read from the
 * calculation draft, the application and the applicant's previous Lifecare payments — nothing is stored,
 * so everything here is read-only input to the form.
 */
export interface Payee {
  name?: string;
  /** The betalsätt as Lifecare names it (bankkonto, bankgiro, plusgiro, utbetalningskort, …). */
  paymentMethod?: string;
  clearing?: string;
  accountNumber?: string;
}

interface ProposedPayment {
  /** The 27th of the concerned month, moved to the Friday before when it falls on a weekend. */
  paymentDate?: string;
  amount?: number;
  concernedMonth?: string;
  payee?: Payee;
  accountingCode?: string;
}

export interface PaymentProposalWarning {
  id?: string;
  type?: string;
  /** The Swedish label to show; `type` is the machine code. */
  typeDisplayName?: string;
  message?: string;
  status?: string;
  statusDisplayName?: string;
}

export interface PaymentProposal {
  payments?: ProposedPayment[];
  /** Every distinct payee on the applicant's Lifecare payments the last 12 months — the dropdown options. */
  payeeOptions?: Payee[];
  payeeSource?: string;
  /** Why the proposal is incomplete (Swedish); absent when it is complete. */
  explanation?: string;
  warnings?: PaymentProposalWarning[];
}

/** Fetches the utbetalningsförslag for an errand. */
export const getPaymentProposal = (errandId: string): Promise<ServiceResponse<PaymentProposal>> =>
  apiService
    .get<ApiResponse<PaymentProposal>>(`errands/${errandId}/payment-proposal`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** A labelled dropdown option from caremanagement's metadata catalogues. */
interface PaymentTypeOption {
  code?: string;
  displayName?: string;
}

/** The Lifecare-sourced dropdown catalogue for the utbetalning form's Betalsätt. */
export interface PaymentMetadata {
  paymentMethods: PaymentTypeOption[];
}

/**
 * The fields sent when registering an utbetalning. caremanagement stores it as DRAFT and queues
 * nothing — the robot is started separately, so saving never sets anything in motion.
 */
export interface PaymentInput {
  paymentDate?: string;
  amount?: number;
  applicationMonth?: string;
  reportedOnStakeholderIds?: string[];
  accountingDate?: string;
  excludedFromPayment?: boolean;
  /**
   * The id of the payee row the recipient was picked from, so the robot gets the payee's Lifecare id
   * rather than matching on name and account number. Left out for a Lifecare-derived payee (no row id).
   */
  payeeId?: string;
  payeeStakeholderId?: string;
  paymentMethod?: string;
  payeeName?: string;
  payeeAddress?: string;
  payeeCareOf?: string;
  payeeZipCode?: string;
  payeeCity?: string;
  clearingNumber?: string;
  accountNumber?: string;
  /** Kontering — free text; FamilyCare exposes no catalogue of accounting codes. */
  accountingCode?: string;
  localPaymentNumber?: string;
  invoiceNumber?: string;
  usesOcr?: boolean;
  messageLines?: string[];
}

/**
 * An utbetalning stored on the errand. Rows come from two places: the ones a handläggare saved in the
 * form (`source` CASEWORKER, status DRAFT) and the ones "Besluta och utbetala" created, which arrive
 * already handed to the robot.
 *
 * `status` is server-managed: DRAFT, PENDING_REGISTRATION while the robot has it, then REGISTERED or
 * FAILED once it reports back. REGISTERED means the utbetalning exists in Lifecare, not that it has been
 * paid out — whether it was effectuated is asked separately.
 */
export interface Payment {
  id?: string;
  source?: string;
  lifecareId?: string;
  status?: string;
  /** Lifecare's own message when the robot reported FAILED — shown to the handläggare as it came. */
  lifecareDetail?: string;
  moneyType?: string;
  paymentDate?: string;
  amount?: number;
  applicationMonth?: string;
  paymentMethod?: string;
  payeeName?: string;
  clearingNumber?: string;
  accountNumber?: string;
  accountingCode?: string;
  messageLines?: string[];
  created?: string;
}

/** The utbetalningar registered on an errand. */
export const getPayments = (errandId: string): Promise<ServiceResponse<Payment[]>> =>
  apiService
    .get<ApiResponse<Payment[]>>(`errands/${errandId}/payments`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Registers an utbetalning on an errand. */
export const createPayment = (errandId: string, input: PaymentInput): Promise<ServiceResponse<null>> =>
  apiService
    .post<ApiResponse<null>>(`errands/${errandId}/payments`, input)
    .then(() => ({ data: null }))
    .catch(toServiceError);

/** The money types and payment methods behind the utbetalning form's dropdowns. */
export const getPaymentMetadata = (): Promise<ServiceResponse<PaymentMetadata>> =>
  apiService
    .get<ApiResponse<PaymentMetadata>>('payment-metadata')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * A selectable betalningsmottagare. A LIFECARE option comes from the applicant's Lifecare payment
 * history and has no id; a MANUAL one was added on the errand and carries how far the robot has got
 * writing it into Lifecare.
 */
export interface PayeeOption {
  id?: string;
  name?: string;
  paymentMethod?: string;
  clearing?: string;
  accountNumber?: string;
  source?: 'LIFECARE' | 'MANUAL';
  lifecareStatus?: 'PENDING' | 'SYNCED' | 'FAILED';
  lifecarePayeeId?: string;
  /** Lifecare's own message when the write failed — shown to the handläggare as it came. */
  lifecareDetail?: string;
  lastPaidOn?: string;
  created?: string;
}

/** The fields sent when adding a betalningsmottagare by hand. */
export interface PayeeInput {
  name: string;
  paymentMethod: string;
  clearing?: string;
  accountNumber?: string;
}

/** The selectable betalningsmottagare on an errand. */
export const getPayees = (errandId: string): Promise<ServiceResponse<PayeeOption[]>> =>
  apiService
    .get<ApiResponse<PayeeOption[]>>(`errands/${errandId}/payees`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Adds a betalningsmottagare by hand; an identical one is reused rather than duplicated. */
export const createPayee = (errandId: string, input: PayeeInput): Promise<ServiceResponse<PayeeOption | null>> =>
  apiService
    .post<ApiResponse<PayeeOption | null>>(`errands/${errandId}/payees`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Removes a manually added betalningsmottagare. */
export const deletePayee = (errandId: string, payeeId: string): Promise<ServiceResponse<null>> =>
  apiService
    .delete<ApiResponse<null>>(`errands/${errandId}/payees/${payeeId}`)
    .then(() => ({ data: null }))
    .catch(toServiceError);
