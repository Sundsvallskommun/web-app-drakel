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
// The Sundsvall Templating service (document/phrase templates). Reached directly, no auth.
export const TEMPLATING_BASE_URL = env.TEMPLATING_BASE_URL ?? '';
// The Active Directory service (handläggare roster). Reached directly, no auth. Optional — the
// administrator list degrades to empty when unset, so it never blocks BFF startup.
export const ACTIVE_DIRECTORY_BASE_URL = env.ACTIVE_DIRECTORY_BASE_URL ?? '';
export const ACTIVE_DIRECTORY_DOMAIN = env.ACTIVE_DIRECTORY_DOMAIN ?? 'personal';
// --- Lifecare (read directly on its own host, with a session of its own) ---
// All optional, and deliberately absent from validateEnv: an unset LIFECARE_BASE_URL means the
// integration is simply not wired in this environment, which fails the calls that need it rather
// than blocking BFF startup for everyone else.
export const LIFECARE_BASE_URL = env.LIFECARE_BASE_URL ?? '';
// The configuration the identity portal normally picks off the query string on a first visit.
// Defaults match the Sundsvall handläggare flow (?domain=..&Actor=..&IDPMethod=saml).
export const LIFECARE_DOMAIN = env.LIFECARE_DOMAIN ?? '';
export const LIFECARE_ACTOR = env.LIFECARE_ACTOR ?? 'Actor_Professional';
export const LIFECARE_IDP_METHOD = env.LIFECARE_IDP_METHOD ?? 'saml';
export const LIFECARE_FEDERATION_PROFILE = env.LIFECARE_FEDERATION_PROFILE ?? '';
// The internal CA that issued Lifecare's and the identity provider's certificates, as PEM. Node
// trusts neither out of the box — see lifecareAgent. Double-quote it so dotenv turns the \n into
// real newlines, the same way SAML_IDP_PUBLIC_CERT is carried.
export const LIFECARE_CA_CERT = env.LIFECARE_CA_CERT ?? '';
// Skips verifying Lifecare's certificate instead of trusting its CA. Gets past the handshake
// without the cert, at the cost of no longer knowing who is on the other end — of a connection
// carrying the integration account's password and personal data. Scoped to Lifecare only, never a
// process-wide NODE_TLS_REJECT_UNAUTHORIZED. Development stopgap; use LIFECARE_CA_CERT for real.
export const LIFECARE_INSECURE_TLS = env.LIFECARE_INSECURE_TLS === 'true';
// The integration account drakel signs in to Lifecare as. Setting LIFECARE_USERNAME is what
// switches the BFF from the pasted-session scaffolding to signing itself in — see
// ServiceAccountLifecareSession. Treat the password like CLIENT_SECRET: env only, never committed.
export const LIFECARE_USERNAME = env.LIFECARE_USERNAME ?? '';
// One password, mixing letters and digits. On the browser sign-in the letters are typed into the
// field and the digits are clicked on the scrambled keypad — see BrowserLifecareSession.
export const LIFECARE_PASSWORD = env.LIFECARE_PASSWORD ?? '';
// Signs in by driving a headless browser instead of replaying the flow over HTTP — see
// BrowserLifecareSession. Needed where the identity provider's login page builds its fields with
// JavaScript, which an HTTP client cannot run. Costs a browser in the image and seconds per sign-in.
export const LIFECARE_BROWSER_SIGN_IN = env.LIFECARE_BROWSER_SIGN_IN === 'true';
// Runs the sign-in browser visibly instead of headless, for watching the flow while developing.
// Slowed down a little so the clicks are followable. Leave off in every real environment.
export const LIFECARE_BROWSER_HEADED = env.LIFECARE_BROWSER_HEADED === 'true';
// How long a Lifecare session is reused before it is proactively re-established. A proxy for
// Lifecare's own inactivity timeout, which we cannot see; the transport still re-signs-in reactively
// if Lifecare drops the session sooner. Defaults to 20 minutes; a non-numeric value falls back too.
export const LIFECARE_SESSION_TTL_MINUTES = Number(env.LIFECARE_SESSION_TTL_MINUTES) || 20;
// Development-only escape hatch: the identity number to read the Lifecare record for, regardless of
// the errand's applicant. Lets the tab be tested against a known Lifecare test person whose reserve
// number the Citizen API cannot produce. Ignored outside development.
export const LIFECARE_CLIENT_ID_OVERRIDE = env.LIFECARE_CLIENT_ID_OVERRIDE ?? '';
// Development scaffolding only — a session copied out of devtools, see PastedLifecareSession.
// Holds a live session belonging to a real user, so it never leaves .env.development.local.
export const LIFECARE_SESSION_COOKIE = env.LIFECARE_SESSION_COOKIE ?? '';
// Test environments only: the beslutsfattare a beslut is registered in Lifecare under, instead of the
// handläggare's own account. Lifecare's test environment knows no real handläggare as beslutsfattare, so
// a beslut cannot be tested end to end without it. Never set in production: there the beslut must name
// the handläggare, and a handläggare Lifecare does not know stops the beslut rather than falling back.
export const LIFECARE_TEST_DECISION_MAKER = env.LIFECARE_TEST_DECISION_MAKER ?? '';
// The Lifecare print template a beslut is rendered as PDF with — for the preview and for what is sent to
// the sökande. The same template serves every beslut.
export const LIFECARE_DECISION_PRINT_TEMPLATE_ID = env.LIFECARE_DECISION_PRINT_TEMPLATE_ID ?? '885bfb68-c97b-47c0-921d-ef00caaa2423';
// Messaging sender config for the beslut notification (Mina sidor / digital brevlåda / brev). Optional —
// the send fails gracefully if unset, so a missing value never blocks BFF startup.
export const MESSAGING_ORGANIZATION_NUMBER = env.MESSAGING_ORGANIZATION_NUMBER ?? '';
export const MESSAGING_DEPARTMENT = env.MESSAGING_DEPARTMENT ?? '';
export const MESSAGING_SUPPORT_TEXT = env.MESSAGING_SUPPORT_TEXT ?? '';
export const MESSAGING_SUPPORT_EMAIL = env.MESSAGING_SUPPORT_EMAIL ?? '';
export const MESSAGING_SUPPORT_PHONE = env.MESSAGING_SUPPORT_PHONE ?? '';
export const MESSAGING_SUPPORT_URL = env.MESSAGING_SUPPORT_URL ?? '';
// Optional — the errand controller falls back to a default type slug when this is unset.
export const CAREMANAGEMENT_TYPE_SLUG = env.CAREMANAGEMENT_TYPE_SLUG;
export const AUTHORIZED_GROUPS = env.AUTHORIZED_GROUPS ?? '';
export const ADMIN_GROUP = env.ADMIN_GROUP ?? '';
// The two halves of /admin are granted separately: managing the shared mallar is a different job from
// following up who read which errand. Both are optional — an unset group means nobody has that half,
// which closes the page rather than blocking startup.
export const TEMPLATE_ADMIN_GROUP = env.TEMPLATE_ADMIN_GROUP ?? '';
export const LOG_ADMIN_GROUP = env.LOG_ADMIN_GROUP ?? '';
export const SAML_CALLBACK_URL = env.SAML_CALLBACK_URL ?? '';
export const SAML_LOGOUT_CALLBACK_URL = env.SAML_LOGOUT_CALLBACK_URL ?? '';
export const SAML_SUCCESS_REDIRECT = env.SAML_SUCCESS_REDIRECT ?? '';
export const SAML_FAILURE_REDIRECT = env.SAML_FAILURE_REDIRECT ?? '';
export const SAML_ENTRY_SSO = env.SAML_ENTRY_SSO ?? '';
export const SAML_ISSUER = env.SAML_ISSUER ?? '';
export const SAML_IDP_PUBLIC_CERT = env.SAML_IDP_PUBLIC_CERT ?? '';
export const SAML_PRIVATE_KEY = env.SAML_PRIVATE_KEY ?? '';
export const SAML_PUBLIC_KEY = env.SAML_PUBLIC_KEY ?? '';
