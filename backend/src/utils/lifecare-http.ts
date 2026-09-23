import { HttpException } from '@exceptions/HttpException';
import { lifecareAgent } from '@utils/lifecare-agent';
import { cookieHeader, LifecareCookieStore } from '@utils/lifecare-cookies';
import axios, { AxiosResponse } from 'axios';

/**
 * Lifecare is an application that has only ever been spoken to by browsers, and applications like
 * that sometimes behave differently for a caller that announces itself as a library. Presenting the
 * browser the flow was captured from removes a variable we would otherwise have to rule out later.
 */
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
  'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
} as const;

/**
 * Lifecare's own answer for "this call needs a session". It is not an HTTP status code — it is a
 * number Lifecare's web client agreed on with its backend, and it arrives with an empty body.
 */
const SESSION_REQUIRED_STATUS = 360;

/** The identity portal every module is bounced through while it is being handed a session. */
const IDENTITY_PORTAL_PATH = 'IdentityPortalWeb';

/** The bootstrap is a short chain; anything longer means the flow is looping on itself. */
const MAX_REDIRECT_HOPS = 10;

/**
 * What makes Lifecare's api2 endpoints answer an automated caller the way they answer Lifecare's
 * own web client.
 *
 * Without `X-Requested-With` the endpoints answer a dead session with the login page as HTML, which
 * a JSON caller can only read as garbage. `ajax-no-cross-domain-redirect` is what turns that into
 * the bare {@link SESSION_REQUIRED_STATUS} the caller can act on.
 *
 * These belong on data calls only. Sending them while following the bootstrap chain would make
 * Lifecare signal instead of redirect, and the session would never be established at all.
 */
export const LIFECARE_AJAX_HEADERS = {
  ...BROWSER_HEADERS,
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'X-Requested-With': 'XMLHttpRequest',
  'ajax-no-cross-domain-redirect': 'true',
} as const;

/** What a browser sends while walking the bootstrap redirects, which are ordinary navigations. */
const LIFECARE_NAVIGATION_HEADERS = {
  ...BROWSER_HEADERS,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
} as const;

/** The `Set-Cookie` headers of a response, narrowed to the strings a cookie store can take in. */
export const setCookieHeaders = (response: AxiosResponse): string[] | undefined => {
  const raw: unknown = response.headers['set-cookie'];
  if (!Array.isArray(raw)) return undefined;
  return raw.filter((entry): entry is string => typeof entry === 'string');
};

const locationHeader = (response: AxiosResponse): string | undefined => {
  const raw: unknown = response.headers.location;
  return typeof raw === 'string' ? raw : undefined;
};

const contentTypeHeader = (response: AxiosResponse): string => {
  const raw: unknown = response.headers['content-type'];
  return typeof raw === 'string' ? raw : '';
};

/**
 * Whether a response means "your session is gone, establish it again".
 *
 * Lifecare says it three different ways depending on which endpoint is asked, so all three are
 * treated alike: the {@link SESSION_REQUIRED_STATUS} signal, a redirect back to the identity
 * portal, and — when the ajax headers did not take — the login page delivered as HTML where JSON
 * was expected. A 401 joins them because an expired ASP.NET session surfaces that way too.
 *
 * A 403 deliberately does not: that is Lifecare saying the account may not see this, and retrying
 * with a brand-new session would only hide a real permission problem behind a second failure.
 */
export const needsLifecareSession = (response: AxiosResponse): boolean => {
  if (response.status === SESSION_REQUIRED_STATUS || response.status === 401) return true;
  if (locationHeader(response)?.includes(IDENTITY_PORTAL_PATH)) return true;
  return contentTypeHeader(response).includes('text/html');
};

/** The start of a response body, whitespace collapsed, for a log line. Empty unless it is text. */
export const bodySnippet = (response: AxiosResponse, limit = 400): string => {
  const body: unknown = response.data;
  return typeof body === 'string' ? body.slice(0, limit).replace(/\s+/g, ' ').trim() : '';
};

/**
 * A one-line description of a response for the log: what came back, what kind of thing it was, and
 * where it was pointing. Carries no body, so it is safe to log wherever.
 */
export const describeResponse = (response: AxiosResponse): string => {
  const parts = [`status ${response.status}`];

  const contentType = contentTypeHeader(response).split(';')[0];
  if (contentType) parts.push(`type ${contentType}`);

  const location = locationHeader(response);
  if (location) parts.push(`redirects to ${location}`);

  return parts.join(', ');
};

/** A form post that starts a chain, rather than a plain navigation. */
export interface LifecareFormPost {
  /** Form fields, already collected from the page that carried them. */
  fields: Record<string, string>;
}

/**
 * Walks a Lifecare redirect chain by hand, carrying the cookies from each hop into the next.
 *
 * Redirects are followed manually rather than by axios because the cookies are the point: the
 * bootstrap only works if what the identity portal sets on one hop is presented on the next, and
 * axios does not carry cookies across a redirect chain of its own accord.
 *
 * Passing `post` submits a form as the first hop; everything after it is a GET, which is what a
 * browser does with a 302 answering a POST.
 *
 * @returns The first response in the chain that is not a redirect
 */
export const followLifecareRedirects = async (
  startUrl: string,
  cookies: LifecareCookieStore,
  post?: LifecareFormPost,
): Promise<AxiosResponse<unknown>> => {
  let url = startUrl;
  let body = post ? new URLSearchParams(post.fields).toString() : undefined;

  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop += 1) {
    const response = await axios<unknown>({
      method: body === undefined ? 'GET' : 'POST',
      url,
      data: body,
      headers: {
        ...LIFECARE_NAVIGATION_HEADERS,
        ...(body === undefined ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' }),
        ...cookieHeader(cookies),
      },
      httpsAgent: lifecareAgent(),
      maxRedirects: 0,
      validateStatus: () => true,
      // The login hops are HTML and must stay strings; nothing here reads a parsed body.
      responseType: 'text',
      timeout: 30000,
    });

    body = undefined;

    cookies.absorbSetCookie(setCookieHeaders(response));

    const location = locationHeader(response);
    if (location === undefined) return response;

    url = new URL(location, url).toString();
  }

  throw new HttpException(502, 'Lifecare kept redirecting while a session was being established');
};
