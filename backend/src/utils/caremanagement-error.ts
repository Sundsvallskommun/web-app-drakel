import { upstreamErrorMapper } from '@/utils/upstream-error';

/**
 * Maps a failed caremanagement call onto the HttpException drakel returns to the frontend.
 *
 * Shared by every caremanagement service so the same upstream status always surfaces the same way
 * (e.g. a 413 on the attachment path and a 413 on the message path both reach the client as 413,
 * instead of one collapsing to a generic 500). Anything unrecognised becomes a 500, and is logged by status and code.
 *
 * A 502 is carried through with caremanagement's own `detail`: it means a system behind caremanagement
 * (Lifecare) refused, and the sentence says which of the handläggare's data it could not work with —
 * "No personal identity number could be resolved for a person on the calculation", say. Replacing that
 * with a generic message would leave the handläggare with a failure and nothing to act on.
 *
 * A 400, 404 and 422 are carried through too: on the Lifecare routes caremanagement words its refusals for the
 * handläggare ("Spara beslutet innan du beslutar och betalar ut."). A 400 without a detail (e.g. a constraint
 * violation) falls back to a generic sentence.
 *
 * A 409 is carried through the same way: it means the errand is not in a state that allows the action
 * (finalize answers it for "wrong status, sections not approved or already finalized"), and the detail
 * says which of those it was.
 */
export const caremanagementError = upstreamErrorMapper('caremanagement');
