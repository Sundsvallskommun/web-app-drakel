import { LifecareAuthStrategy } from '@interfaces/lifecare.interface';
import LifecareApiService from '@services/lifecare-api.service';
import LifecareSessionService from '@services/lifecare-session.service';
import { AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosRequest = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: Object.assign(axiosRequest, { isAxiosError: () => false }),
}));

vi.mock('@config', () => ({
  NODE_ENV: 'test',
  LIFECARE_BASE_URL: 'https://lifecare.test',
  LIFECARE_DOMAIN: 'SundsvallVoO_PLUS',
  LIFECARE_ACTOR: 'Actor_Professional',
  LIFECARE_IDP_METHOD: 'saml',
  LIFECARE_FEDERATION_PROFILE: 'Sundsvall_Intra',
  LIFECARE_SESSION_COOKIE: '',
  LIFECARE_USERNAME: '',
  LIFECARE_PASSWORD: '',
  LIFECARE_CA_CERT: '',
  LIFECARE_INSECURE_TLS: false,
  LIFECARE_SESSION_TTL_MINUTES: 20,
}));

vi.mock('@utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// The transport must not read or write a real session file during tests: each test drives the
// session through its strategy, so persistence is stubbed to a no-op with nothing on disk.
vi.mock('@utils/lifecare-session-store', () => ({
  loadPersistedSession: () => undefined,
  savePersistedSession: vi.fn(),
  clearPersistedSession: vi.fn(),
}));

const lifecareResponse = (status: number, data: unknown = {}, headers: Record<string, unknown> = {}): AxiosResponse =>
  ({ status, data, statusText: '', headers, config: {} }) as unknown as AxiosResponse;

/** Lifecare's answer when a module has no session of its own yet. */
const wantsSession = () => lifecareResponse(360);

/** The Heartbeat bootstrap, which arrives as a plain 200 once its redirects have been walked. */
const bootstrapped = () => lifecareResponse(200);

/** A session that is simply handed to us, so the tests are about the transport and nothing else. */
const signedIn: LifecareAuthStrategy = {
  name: 'a test session',
  authenticate: cookies => {
    cookies.set('ASP.NET_SessionId', 'qvga4');
    return Promise.resolve();
  },
};

const lifecare = () => new LifecareApiService(new LifecareSessionService(signedIn));

const personSearch = { module: 'WESE.FC.ProfessionalWeb', path: 'api2/Person/Search' } as const;

const callsMade = () => axiosRequest.mock.calls.map(call => call[0] as { url: string; headers: Record<string, string> });

describe('LifecareApiService.get', () => {
  beforeEach(() => {
    axiosRequest.mockReset();
  });

  it('asks for the data straight away rather than bootstrapping first', async () => {
    // A freshly signed-in session is often good enough on its own, and Lifecare's own client does
    // not bootstrap speculatively either. One call, not two.
    axiosRequest.mockResolvedValueOnce(lifecareResponse(200, { name: 'Anna' }));

    await expect(lifecare().get(personSearch)).resolves.toEqual({ data: { name: 'Anna' }, message: 'success' });

    expect(axiosRequest).toHaveBeenCalledTimes(1);
    expect(callsMade()[0]?.url).toBe('https://lifecare.test/WESE.FC.ProfessionalWeb/api2/Person/Search');
  });

  it('sends the session and the headers that make api2 answer a machine', async () => {
    axiosRequest.mockResolvedValueOnce(lifecareResponse(200, {}));

    await lifecare().get(personSearch);

    const headers = callsMade()[0]?.headers ?? {};
    expect(headers.Cookie).toContain('ASP.NET_SessionId=qvga4');
    expect(headers['X-Requested-With']).toBe('XMLHttpRequest');
    expect(headers['ajax-no-cross-domain-redirect']).toBe('true');
    expect(headers.Referer).toBe('https://lifecare.test/WE.Flow.Html/');
  });

  it('bootstraps the module and asks again when Lifecare says it needs a session', async () => {
    axiosRequest
      .mockResolvedValueOnce(wantsSession())
      .mockResolvedValueOnce(bootstrapped())
      .mockResolvedValueOnce(lifecareResponse(200, { name: 'Anna' }));

    await expect(lifecare().get(personSearch)).resolves.toEqual({ data: { name: 'Anna' }, message: 'success' });

    expect(callsMade()[1]?.url).toBe('https://lifecare.test/WESE.FC.ProfessionalWeb/Heartbeat');
    expect(axiosRequest).toHaveBeenCalledTimes(3);
  });

  it('bootstraps a module once and reuses it for later calls', async () => {
    axiosRequest
      .mockResolvedValueOnce(wantsSession())
      .mockResolvedValueOnce(bootstrapped())
      .mockResolvedValueOnce(lifecareResponse(200, {}))
      .mockResolvedValueOnce(lifecareResponse(200, {}));

    const service = lifecare();
    await service.get(personSearch);
    await service.get(personSearch);

    // The second call is one request: the module already has its artifact.
    expect(axiosRequest).toHaveBeenCalledTimes(4);
  });

  it('signs in again when a bootstrap was not what was missing', async () => {
    // The session itself has expired rather than the module's artifact, so the bootstrap changes
    // nothing and the next escalation is a fresh sign-in.
    axiosRequest
      .mockResolvedValueOnce(wantsSession())
      .mockResolvedValueOnce(bootstrapped())
      .mockResolvedValueOnce(wantsSession())
      .mockResolvedValueOnce(lifecareResponse(200, { name: 'Anna' }));

    await expect(lifecare().get(personSearch)).resolves.toEqual({ data: { name: 'Anna' }, message: 'success' });

    expect(axiosRequest).toHaveBeenCalledTimes(4);
  });

  it('gives up once signing in again has not helped either', async () => {
    axiosRequest
      .mockResolvedValueOnce(wantsSession())
      .mockResolvedValueOnce(bootstrapped())
      .mockResolvedValueOnce(wantsSession())
      .mockResolvedValueOnce(wantsSession());

    await expect(lifecare().get(personSearch)).rejects.toMatchObject({ status: 502 });

    // Four requests and no more — escalating past a fresh session would only spin.
    expect(axiosRequest).toHaveBeenCalledTimes(4);
  });

  it('passes a 404 on as a 404', async () => {
    axiosRequest.mockResolvedValueOnce(lifecareResponse(404));

    await expect(lifecare().get(personSearch)).rejects.toMatchObject({ status: 404 });
  });

  it('does not treat a 403 as an expired session', async () => {
    axiosRequest.mockResolvedValueOnce(lifecareResponse(403));

    await expect(lifecare().get(personSearch)).rejects.toMatchObject({ status: 403 });

    // No bootstrap, no re-sign-in: the account is not allowed to read this, and neither would help.
    expect(axiosRequest).toHaveBeenCalledTimes(1);
  });

  it('reports Lifecare as unreachable when the call never lands', async () => {
    axiosRequest.mockRejectedValueOnce(new Error('socket hang up'));

    await expect(lifecare().get(personSearch)).rejects.toMatchObject({ status: 502 });
  });

  it('runs one sign-in for calls that arrive together', async () => {
    axiosRequest.mockResolvedValue(lifecareResponse(200, {}));
    const authenticate = vi.fn(() => Promise.resolve());

    const service = new LifecareApiService(new LifecareSessionService({ name: 'a test session', authenticate }));
    await Promise.all([service.get(personSearch), service.get(personSearch), service.get(personSearch)]);

    expect(authenticate).toHaveBeenCalledTimes(1);
  });
});
