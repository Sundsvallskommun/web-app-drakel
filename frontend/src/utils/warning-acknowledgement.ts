import { Warning } from '@services/warning-service';

/**
 * Warning types caremanagement closes by itself, so a handläggare has nothing to acknowledge.
 *
 * SSBTEK_READ_FAILED closes the day a later read succeeds; offering "Kvittera" would let a handläggare
 * dismiss a state they cannot affect, and the warning would come straight back on the next failed run.
 * caremanagement exposes no flag for this — `autoResolved` says whether a warning *was* closed
 * automatically, not whether it can be acknowledged — so the types are listed here.
 */
const SELF_CLOSING_WARNING_TYPES: readonly string[] = ['SSBTEK_READ_FAILED'];

/** Whether a handläggare can acknowledge this warning at all. */
export const isAcknowledgeable = (warning: Warning): boolean =>
  !SELF_CLOSING_WARNING_TYPES.includes(warning.type ?? '');
