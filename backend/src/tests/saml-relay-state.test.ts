import { allowedRedirect, buildRelayState, parseRelayState } from '@utils/saml-relay-state';
import { describe, expect, it, vi } from 'vitest';

// The allowed origins, as ORIGIN would list them.
vi.mock('@/config', () => ({ ORIGIN: 'http://localhost:3000, https://drakel.sundsvall.se' }));

const FALLBACK = 'https://drakel.sundsvall.se/';

describe('SAML RelayState', () => {
  it('carries the success and failure redirects through the IdP', () => {
    const relayState = buildRelayState('http://localhost:3000/oversikt', 'http://localhost:3000/login');

    const { successRedirect, failureRedirect } = parseRelayState(relayState, FALLBACK);

    expect(successRedirect.toString()).toBe('http://localhost:3000/oversikt');
    expect(failureRedirect.toString()).toBe('http://localhost:3000/login');
  });

  it('falls back when a redirect leads off the allowed origins — no open redirect', () => {
    const { successRedirect, failureRedirect } = parseRelayState(buildRelayState('https://evil.example/phish', 'javascript:alert(1)'), FALLBACK);

    expect(successRedirect.toString()).toBe(FALLBACK);
    expect(failureRedirect.toString()).toBe(FALLBACK);
  });

  it('uses the success redirect after a failure when no failure redirect was asked for', () => {
    expect(parseRelayState(buildRelayState('http://localhost:3000/arende/EB-1'), FALLBACK).failureRedirect.toString()).toBe(
      'http://localhost:3000/arende/EB-1',
    );
  });

  it('falls back on a RelayState that is missing or not text', () => {
    expect(parseRelayState(undefined, FALLBACK).successRedirect.toString()).toBe(FALLBACK);
    expect(parseRelayState(['http://localhost:3000/'], FALLBACK).successRedirect.toString()).toBe(FALLBACK);
  });

  it('allows a redirect only as an absolute http(s) URL on an allowed origin', () => {
    expect(allowedRedirect('http://localhost:3000/x')?.toString()).toBe('http://localhost:3000/x');
    expect(allowedRedirect('/relative')).toBeUndefined();
    expect(allowedRedirect('http://localhost:3001/x')).toBeUndefined();
    expect(allowedRedirect(42)).toBeUndefined();
  });
});
