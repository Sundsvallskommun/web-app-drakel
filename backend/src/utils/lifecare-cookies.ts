/**
 * Whether a `Set-Cookie` attribute list says the cookie is being removed rather than set.
 *
 * Lifecare clears cookies this way when a session ends, so honouring it is what keeps a stale
 * `ASP.NET_SessionId` from being sent long after Lifecare stopped recognising it.
 */
const isDeletion = (attributes: string[]): boolean =>
  attributes.some(attribute => {
    const separator = attribute.indexOf('=');
    if (separator <= 0) return false;
    const name = attribute.slice(0, separator).trim().toLowerCase();
    const value = attribute.slice(separator + 1).trim();

    if (name === 'max-age') {
      const seconds = Number(value);
      return !Number.isNaN(seconds) && seconds <= 0;
    }
    if (name === 'expires') {
      const expiry = Date.parse(value);
      return !Number.isNaN(expiry) && expiry <= Date.now();
    }
    return false;
  });

/** Splits `name=value` on its first `=`, since cookie values routinely contain more of them. */
const splitPair = (pair: string): [string, string] | undefined => {
  const separator = pair.indexOf('=');
  if (separator <= 0) return undefined;
  return [pair.slice(0, separator).trim(), pair.slice(separator + 1).trim()];
};

/**
 * The cookies of one Lifecare session.
 *
 * A Lifecare session is several cookies at once: the ones the login flow issues
 * (`ASP.NET_SessionId`, `LEGACY-TOKEN`, `IDP`) plus the configuration cookies the identity portal
 * reads off the query string on the first visit (`metadomain`, `actor`, `idpmethod`,
 * `federationprofile`).
 *
 * Every cookie in that flow is host-bound to the Lifecare host, which is why this store ignores
 * Domain and Path outright: everything it holds is sent to that one host and to nowhere else. A
 * general-purpose cookie jar would buy nothing here and cost two dependencies.
 */
export class LifecareCookieStore {
  private readonly cookies = new Map<string, string>();

  /** Sets one cookie directly — used for the configuration cookies, which no response issues. */
  public set(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  /** Takes in the `Set-Cookie` headers of one response, honouring the ones that delete a cookie. */
  public absorbSetCookie(headers: string[] | undefined): void {
    if (!headers) return;

    for (const header of headers) {
      const [pair, ...attributes] = header.split(';');
      const cookie = pair === undefined ? undefined : splitPair(pair);
      if (!cookie) continue;

      const [name, value] = cookie;
      if (isDeletion(attributes)) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  /** Takes in a whole `Cookie:` request header — the shape you copy out of devtools or a curl. */
  public absorbCookieHeader(header: string): void {
    for (const pair of header.split(';')) {
      const cookie = splitPair(pair);
      if (cookie) this.cookies.set(cookie[0], cookie[1]);
    }
  }

  /** The `Cookie` request header for everything held, or an empty string while nothing is. */
  public toHeader(): string {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  public has(name: string): boolean {
    return this.cookies.has(name);
  }

  /** The value of one cookie, or undefined when it is not held. */
  public get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  /** The names held, with no values — safe to log, and enough to compare one session to another. */
  public names(): string[] {
    return [...this.cookies.keys()];
  }

  /** Every cookie as name/value pairs — for persisting the session to disk. */
  public entries(): [string, string][] {
    return [...this.cookies];
  }

  /** Replaces everything held with the given pairs — for restoring a persisted session. */
  public replaceAll(entries: [string, string][]): void {
    this.cookies.clear();
    for (const [name, value] of entries) {
      this.cookies.set(name, value);
    }
  }

  public clear(): void {
    this.cookies.clear();
  }
}

/**
 * The cookie whose presence means a Lifecare session is signed in, rather than merely started.
 *
 * Emphatically not `ASP.NET_SessionId`: that one is handed to anybody who loads a page, signed in
 * or not, so treating it as proof accepts a session that is only a session in name. `LEGACY-TOKEN`
 * is issued at the far end of the SAML round trip and is the first thing in the flow that says who
 * you are.
 */
export const SIGNED_IN_COOKIE = 'LEGACY-TOKEN';

/** The `Cookie` header for a store, or no header at all while it is still empty. */
export const cookieHeader = (cookies: LifecareCookieStore): Record<string, string> => {
  const header = cookies.toHeader();
  return header ? { Cookie: header } : {};
};
