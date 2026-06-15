import { config } from 'dotenv';

import { APIS } from './api-config';

export { APIS };

// `quiet: true` suppresses dotenv 17's startup banner so it doesn't pollute server logs.
config({ path: `.env.${process.env.NODE_ENV ?? 'development'}.local`, quiet: true });

const env = process.env;

export const CREDENTIALS = env.CREDENTIALS === 'true';
export const SWAGGER_ENABLED = env.SWAGGER_ENABLED === 'true';
export const SESSION_MEMORY = env.SESSION_MEMORY === 'true';

// The values below are required at runtime: validateEnv() (called at startup in server.ts)
// exits the process if any are missing, so typing them as `string` is honest for the rest
// of the codebase. The `?? <default>` fallbacks keep the types non-optional without making
// merely importing this module trigger validation (which would break unit tests).
export const NODE_ENV = env.NODE_ENV ?? 'development';
export const PORT = env.PORT ?? '';
export const APP_NAME = env.APP_NAME ?? '';
export const API_BASE_URL = env.API_BASE_URL ?? '';
export const LOG_FORMAT = env.LOG_FORMAT ?? 'dev';
export const LOG_DIR = env.LOG_DIR ?? '../../data/logs';
export const ORIGIN = env.ORIGIN ?? '';
export const SECRET_KEY = env.SECRET_KEY ?? '';
export const CLIENT_KEY = env.CLIENT_KEY ?? '';
export const CLIENT_SECRET = env.CLIENT_SECRET ?? '';
export const BASE_URL_PREFIX = env.BASE_URL_PREFIX ?? '';
export const MUNICIPALITY_ID = env.MUNICIPALITY_ID ?? '';
export const CAREMANAGEMENT_BASE_URL = env.CAREMANAGEMENT_BASE_URL ?? '';
export const CAREMANAGEMENT_NAMESPACE = env.CAREMANAGEMENT_NAMESPACE ?? '';
// Optional — the errand controller falls back to a default type slug when this is unset.
export const CAREMANAGEMENT_TYPE_SLUG = env.CAREMANAGEMENT_TYPE_SLUG;
export const AUTHORIZED_GROUPS = env.AUTHORIZED_GROUPS ?? '';
export const ADMIN_GROUP = env.ADMIN_GROUP ?? '';
export const SAML_CALLBACK_URL = env.SAML_CALLBACK_URL ?? '';
export const SAML_LOGOUT_CALLBACK_URL = env.SAML_LOGOUT_CALLBACK_URL ?? '';
export const SAML_SUCCESS_REDIRECT = env.SAML_SUCCESS_REDIRECT ?? '';
export const SAML_FAILURE_REDIRECT = env.SAML_FAILURE_REDIRECT ?? '';
export const SAML_ENTRY_SSO = env.SAML_ENTRY_SSO ?? '';
export const SAML_ISSUER = env.SAML_ISSUER ?? '';
export const SAML_IDP_PUBLIC_CERT = env.SAML_IDP_PUBLIC_CERT ?? '';
export const SAML_PRIVATE_KEY = env.SAML_PRIVATE_KEY ?? '';
export const SAML_PUBLIC_KEY = env.SAML_PUBLIC_KEY ?? '';
