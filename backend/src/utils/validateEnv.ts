import { cleanEnv, port, str, url } from 'envalid';

import { logger } from './logger';
import { isValidUrl } from './util';

/** The shortest session secret accepted without a warning. */
const MIN_SECRET_KEY_LENGTH = 32;

/** Placeholders a SECRET_KEY must not be left at — the example env's among them. */
const PLACEHOLDER_SECRETS = new Set(['changeme', 'secret', 'change-me', 'insert secret key']);

/**
 * What in the environment is weak or malformed without being fatal: a short or placeholder SECRET_KEY in production,
 * an ORIGIN entry or a SAML_SUCCESS_REDIRECT that is not a URL. Returned as warnings rather than exiting, so a
 * deployment that runs today keeps starting while the log says what to fix.
 *
 * @param env The environment, process.env
 */
export const environmentWarnings = (env: NodeJS.ProcessEnv): string[] => {
  const warnings: string[] = [];
  const secretKey = env.SECRET_KEY ?? '';
  if (env.NODE_ENV === 'production' && (secretKey.length < MIN_SECRET_KEY_LENGTH || PLACEHOLDER_SECRETS.has(secretKey.trim().toLowerCase()))) {
    warnings.push(
      `SECRET_KEY is a placeholder or shorter than ${MIN_SECRET_KEY_LENGTH} characters: the session cookie's signature is only as strong as it.`,
    );
  }
  const malformedOrigins = (env.ORIGIN ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin !== '' && origin !== '*' && !isValidUrl(origin));
  if (malformedOrigins.length > 0) {
    warnings.push(`ORIGIN lists entries that are not URLs (${malformedOrigins.join(', ')}); CORS can never match them.`);
  }
  if (!isValidUrl(env.SAML_SUCCESS_REDIRECT ?? '')) {
    warnings.push('SAML_SUCCESS_REDIRECT is not an http(s) URL; it is where a login or logout lands when no other redirect is allowed.');
  }
  return warnings;
};

// NOTE: Make sure we got these in ENV
const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    SECRET_KEY: str(),
    API_BASE_URL: str(),
    CLIENT_KEY: str(),
    CLIENT_SECRET: str(),
    PORT: port(),
    BASE_URL_PREFIX: str(),
    MUNICIPALITY_ID: str(),
    CAREMANAGEMENT_NAMESPACE: str(),
    AUTHORIZED_GROUPS: str(),
    ADMIN_GROUP: str(),
    SAML_CALLBACK_URL: url(),
    SAML_LOGOUT_CALLBACK_URL: url(),
    SAML_FAILURE_REDIRECT: url(),
    SAML_ENTRY_SSO: url(),
    SAML_ISSUER: str(),
    SAML_IDP_PUBLIC_CERT: str(),
    SAML_PRIVATE_KEY: str(),
    SAML_PUBLIC_KEY: str(),
  });
  environmentWarnings(process.env).forEach(warning => logger.warn(warning));
};

export default validateEnv;
