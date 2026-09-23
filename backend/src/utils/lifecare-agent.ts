import { Agent } from 'node:https';
import { rootCertificates } from 'node:tls';

import { LIFECARE_CA_CERT, LIFECARE_INSECURE_TLS, NODE_ENV } from '@config';
import { logger } from '@utils/logger';

/**
 * The HTTPS agent every Lifecare call goes through — the login hops at the identity provider
 * included, since those are internal hosts too.
 *
 * Lifecare and the identity provider present certificates issued by an internal CA. A workstation
 * trusts it because Windows does; Node ships its own trust store and does not, which surfaces as
 * `unable to get local issuer certificate`. Node's `--use-system-ca` fixes that on a workstation
 * and only there — in the container the system store is the image's, which has never heard of the
 * CA either. So the CA travels as configuration instead, exactly like SAML_IDP_PUBLIC_CERT already
 * does, and the same value works in every environment.
 *
 * The CA is *added* to the public ones rather than replacing them: passing `ca` on its own would
 * narrow these connections to trusting nothing but the internal CA, which is a surprise waiting to
 * happen the day something in the flow sits behind a public certificate.
 *
 * Trust is widened for Lifecare's calls alone. caremanagement and the API gateway keep the stock
 * trust store, because nothing about this should change what they accept.
 */
let agent: Agent | undefined;

/**
 * Says out loud what has been turned off, once, when the agent is built.
 *
 * Skipping verification keeps the traffic encrypted but stops Node checking *who* it is encrypted
 * to. On this particular connection that matters more than most: the integration account's password
 * is posted across it during sign-in, and personal data comes back across it. Anything able to sit
 * in the middle — a stale DNS record, a transparent proxy, someone already inside the network —
 * gets both, and nothing in the handshake objects.
 *
 * It is deliberately not blocked outside development, because that decision belongs to whoever runs
 * the service rather than to this file. It is logged as an error there instead, so it can never be
 * left on quietly.
 */
const announceDisabledVerification = (): void => {
  const warning = 'Lifecare TLS certificate verification is OFF — the connection is encrypted but the server is not verified';
  if (NODE_ENV === 'development') {
    logger.warn(`${warning}. Fine while testing; set LIFECARE_CA_CERT before this reaches a server.`);
  } else {
    logger.error(`${warning}, and NODE_ENV is ${NODE_ENV}. Credentials and personal data cross this connection.`);
  }
};

export const lifecareAgent = (): Agent => {
  if (!agent) {
    if (LIFECARE_INSECURE_TLS) announceDisabledVerification();

    agent = new Agent({
      ca: LIFECARE_CA_CERT ? [...rootCertificates, LIFECARE_CA_CERT] : undefined,
      // Scoped to Lifecare on purpose. NODE_TLS_REJECT_UNAUTHORIZED would do the same thing to
      // every outbound call in the process, caremanagement and the gateway included.
      rejectUnauthorized: !LIFECARE_INSECURE_TLS,
      // The login flow is a chain of requests to the same two hosts; reusing the connection saves a
      // TLS handshake on each hop.
      keepAlive: true,
    });
  }
  return agent;
};
