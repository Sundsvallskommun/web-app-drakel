import { cookieHeader, LifecareCookieStore } from '@utils/lifecare-cookies';
import { describe, expect, it } from 'vitest';

describe('LifecareCookieStore', () => {
  it('keeps the value of a Set-Cookie and drops its attributes', () => {
    const cookies = new LifecareCookieStore();

    cookies.absorbSetCookie(['ASP.NET_SessionId=qvga4oclpak0suzk; path=/; HttpOnly; SameSite=Lax']);

    expect(cookies.toHeader()).toBe('ASP.NET_SessionId=qvga4oclpak0suzk');
  });

  it('keeps a value that contains its own = signs', () => {
    // LEGACY-TOKEN and the __RequestVerificationToken pair are base64-ish and routinely end in
    // padding, so splitting on every = would truncate the session.
    const cookies = new LifecareCookieStore();

    cookies.absorbSetCookie(['LEGACY-TOKEN=5lJq-jrZ2t1TdnBp==; path=/']);

    expect(cookies.toHeader()).toBe('LEGACY-TOKEN=5lJq-jrZ2t1TdnBp==');
  });

  it('forgets a cookie the response is clearing', () => {
    // Lifecare clears cookies this way when a session ends. Ignoring it would leave us presenting a
    // session Lifecare has already forgotten.
    const cookies = new LifecareCookieStore();
    cookies.absorbSetCookie(['IDP=e5db0179-fd62']);

    cookies.absorbSetCookie(['IDP=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/']);

    expect(cookies.has('IDP')).toBe(false);
  });

  it('forgets a cookie cleared with Max-Age=0', () => {
    const cookies = new LifecareCookieStore();
    cookies.absorbSetCookie(['IDP=e5db0179-fd62']);

    cookies.absorbSetCookie(['IDP=dead; Max-Age=0']);

    expect(cookies.has('IDP')).toBe(false);
  });

  it('keeps a cookie whose expiry is still ahead', () => {
    const cookies = new LifecareCookieStore();
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

    cookies.absorbSetCookie([`metadomain=SundsvallVoO_PLUS; expires=${nextYear}`]);

    expect(cookies.has('metadomain')).toBe(true);
  });

  it('takes in a whole Cookie header, the shape copied out of devtools', () => {
    const cookies = new LifecareCookieStore();

    cookies.absorbCookieHeader('metadomain=SundsvallVoO_PLUS; ASP.NET_SessionId=qvga4; actor=Actor_Professional');

    expect(cookies.has('metadomain')).toBe(true);
    expect(cookies.has('ASP.NET_SessionId')).toBe(true);
    expect(cookies.has('actor')).toBe(true);
  });

  it('lets a later value replace an earlier one', () => {
    const cookies = new LifecareCookieStore();
    cookies.absorbCookieHeader('ASP.NET_SessionId=first');

    cookies.absorbSetCookie(['ASP.NET_SessionId=second; path=/']);

    expect(cookies.toHeader()).toBe('ASP.NET_SessionId=second');
  });

  it('skips a malformed entry instead of storing a nameless cookie', () => {
    const cookies = new LifecareCookieStore();

    cookies.absorbSetCookie(['=orphaned', 'Secure', 'IDP=kept']);

    expect(cookies.toHeader()).toBe('IDP=kept');
  });
});

describe('cookieHeader', () => {
  it('sends no Cookie header at all while the store is empty', () => {
    // An empty `Cookie:` header is not the same as no header, and Lifecare's identity portal
    // answers the two differently.
    expect(cookieHeader(new LifecareCookieStore())).toEqual({});
  });

  it('carries everything held in one header', () => {
    const cookies = new LifecareCookieStore();
    cookies.set('metadomain', 'SundsvallVoO_PLUS');
    cookies.set('ASP.NET_SessionId', 'qvga4');

    expect(cookieHeader(cookies)).toEqual({ Cookie: 'metadomain=SundsvallVoO_PLUS; ASP.NET_SessionId=qvga4' });
  });
});
