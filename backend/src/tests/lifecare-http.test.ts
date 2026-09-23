import { LifecareCookieStore } from '@utils/lifecare-cookies';
import { followLifecareRedirects, needsLifecareSession } from '@utils/lifecare-http';
import { AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosRequest = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: Object.assign(axiosRequest, { isAxiosError: () => false }),
}));

const lifecareResponse = (status: number, headers: Record<string, unknown> = {}, data: unknown = {}): AxiosResponse =>
  ({ status, data, statusText: '', headers, config: {} }) as unknown as AxiosResponse;

describe('needsLifecareSession', () => {
  it('recognises the 360 Lifecare answers a dead session with', () => {
    expect(needsLifecareSession(lifecareResponse(360))).toBe(true);
  });

  it('recognises a redirect back to the identity portal', () => {
    const bounced = lifecareResponse(302, {
      location: 'https://lifecare.test/HCW.Welfare.Common.IdentityPortalWeb/Start.aspx?domain=SundsvallVoO_PLUS',
    });

    expect(needsLifecareSession(bounced)).toBe(true);
  });

  it('recognises the login page arriving where JSON was expected', () => {
    expect(needsLifecareSession(lifecareResponse(200, { 'content-type': 'text/html; charset=utf-8' }))).toBe(true);
  });

  it('treats a 401 as an expired session', () => {
    expect(needsLifecareSession(lifecareResponse(401))).toBe(true);
  });

  it('leaves a 403 alone, since a new session would not change the answer', () => {
    // 403 is Lifecare saying this account may not read this. Re-authenticating would hide a real
    // permission problem behind a second, identical failure.
    expect(needsLifecareSession(lifecareResponse(403))).toBe(false);
  });

  it('passes an ordinary JSON answer through', () => {
    expect(needsLifecareSession(lifecareResponse(200, { 'content-type': 'application/json' }))).toBe(false);
  });
});

describe('followLifecareRedirects', () => {
  beforeEach(() => {
    axiosRequest.mockReset();
  });

  it('carries the cookies of each hop into the next one', async () => {
    // This is the whole reason redirects are walked by hand: the artifact only works if what the
    // identity portal sets on the way through is presented on the way back.
    axiosRequest
      .mockResolvedValueOnce(
        lifecareResponse(302, {
          location: '/HCW.Welfare.Common.IdentityPortalWeb/Start.aspx?domain=SundsvallVoO_PLUS',
          'set-cookie': ['IDP=e5db0179-fd62; path=/'],
        }),
      )
      .mockResolvedValueOnce(
        lifecareResponse(302, {
          location: '/WESE.FC.ProfessionalWeb/Heartbeat?artifact=fqNM2eT2cCnC',
          'set-cookie': ['ASP.NET_SessionId=qvga4; path=/; HttpOnly'],
        }),
      )
      .mockResolvedValueOnce(lifecareResponse(200));

    const cookies = new LifecareCookieStore();
    const response = await followLifecareRedirects('https://lifecare.test/WESE.FC.ProfessionalWeb/Heartbeat', cookies);

    expect(response.status).toBe(200);
    expect(cookies.has('IDP')).toBe(true);
    expect(cookies.has('ASP.NET_SessionId')).toBe(true);

    const calls = axiosRequest.mock.calls;
    const lastCall = calls[calls.length - 1]?.[0] as { url: string; headers: Record<string, string> };
    expect(lastCall.url).toBe('https://lifecare.test/WESE.FC.ProfessionalWeb/Heartbeat?artifact=fqNM2eT2cCnC');
    expect(lastCall.headers.Cookie).toContain('ASP.NET_SessionId=qvga4');
  });

  it('stops at the first response that is not a redirect', async () => {
    axiosRequest.mockResolvedValueOnce(lifecareResponse(200));

    await followLifecareRedirects('https://lifecare.test/WESE.FC.ProfessionalWeb/Heartbeat', new LifecareCookieStore());

    expect(axiosRequest).toHaveBeenCalledTimes(1);
  });

  it('gives up rather than following a redirect loop for ever', async () => {
    axiosRequest.mockResolvedValue(lifecareResponse(302, { location: '/round/and/round' }));

    await expect(followLifecareRedirects('https://lifecare.test/WESE.FC.ProfessionalWeb/Heartbeat', new LifecareCookieStore())).rejects.toMatchObject(
      { status: 502 },
    );
  });
});
