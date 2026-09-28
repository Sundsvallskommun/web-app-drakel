import { ValidateInResponseTo } from '@node-saml/passport-saml';

const CHECKS_BY_NAME: Record<string, ValidateInResponseTo> = {
  always: ValidateInResponseTo.always,
  ifPresent: ValidateInResponseTo.ifPresent,
  never: ValidateInResponseTo.never,
};

/**
 * How the IdP's response is tied to a login drakel started, from configuration. `always` — the default, and what an
 * unknown value falls back to — refuses a response that answers no login request of ours, so an unsolicited or a
 * replayed response cannot sign anyone in. `ifPresent` also lets an IdP-initiated login in; `never` turns the check off.
 *
 * The request ids are kept in memory, like the sessions: a login must come back to the backend instance that started it.
 *
 * @param configured SAML_VALIDATE_IN_RESPONSE_TO, or undefined when unset
 */
export const toInResponseToCheck = (configured: string | undefined): ValidateInResponseTo =>
  (configured === undefined ? undefined : CHECKS_BY_NAME[configured]) ?? ValidateInResponseTo.always;
