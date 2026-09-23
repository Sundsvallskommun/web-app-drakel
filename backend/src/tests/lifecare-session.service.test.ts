import { LifecareAuthStrategy } from '@interfaces/lifecare.interface';
import LifecareSessionService from '@services/lifecare-session.service';
import { PersistedLifecareSession } from '@utils/lifecare-session-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@config', () => ({
  LIFECARE_BASE_URL: 'https://lifecare.test',
  LIFECARE_DOMAIN: 'SundsvallVoO_PLUS',
  LIFECARE_ACTOR: 'Actor_Professional',
  LIFECARE_IDP_METHOD: 'saml',
  LIFECARE_FEDERATION_PROFILE: 'Sundsvall_Intra',
  LIFECARE_SESSION_TTL_MINUTES: 20,
  NODE_ENV: 'test',
}));

vi.mock('@utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// The session read back at construction is controlled per test through this holder, and the writes
// are spies so nothing touches disk.
const persisted = vi.hoisted(() => ({ current: undefined as PersistedLifecareSession | undefined }));
const saveSpy = vi.hoisted(() => vi.fn());
const clearSpy = vi.hoisted(() => vi.fn());

vi.mock('@utils/lifecare-session-store', () => ({
  loadPersistedSession: () => persisted.current,
  savePersistedSession: saveSpy,
  clearPersistedSession: clearSpy,
}));

/** A strategy that signs in by dropping the cookie a real sign-in would leave behind. */
const signingInStrategy = (): LifecareAuthStrategy & { authenticate: ReturnType<typeof vi.fn> } => ({
  name: 'a test sign-in',
  authenticate: vi.fn((cookies: { set(name: string, value: string): void }) => {
    cookies.set('LEGACY-TOKEN', 'fresh-token');
    return Promise.resolve();
  }),
});

const minutesAgo = (minutes: number): number => Date.now() - minutes * 60_000;

describe('LifecareSessionService session lifetime', () => {
  beforeEach(() => {
    persisted.current = undefined;
    saveSpy.mockClear();
    clearSpy.mockClear();
  });

  it('reuses a persisted session without signing in again', async () => {
    persisted.current = {
      cookies: [
        ['metadomain', 'SundsvallVoO_PLUS'],
        ['LEGACY-TOKEN', 'stored-token'],
      ],
      establishedAt: minutesAgo(5),
    };
    const strategy = signingInStrategy();

    const headers = await new LifecareSessionService(strategy).prepare();

    expect(strategy.authenticate).not.toHaveBeenCalled();
    // The stored session's own token is what goes back out, in the cookie and the guard header.
    expect(headers.Cookie).toContain('LEGACY-TOKEN=stored-token');
    expect(headers['X-LEGACY-TOKEN']).toBe('stored-token');
  });

  it('signs in again when the persisted session has passed its TTL', async () => {
    persisted.current = {
      cookies: [['LEGACY-TOKEN', 'stale-token']],
      establishedAt: minutesAgo(21), // TTL is 20 minutes
    };
    const strategy = signingInStrategy();

    const headers = await new LifecareSessionService(strategy).prepare();

    expect(strategy.authenticate).toHaveBeenCalledTimes(1);
    // The dead session was cleared from disk, and the fresh token is the one now in play.
    expect(clearSpy).toHaveBeenCalled();
    expect(headers['X-LEGACY-TOKEN']).toBe('fresh-token');
  });

  it('signs in and persists when there is no session on disk', async () => {
    const strategy = signingInStrategy();

    await new LifecareSessionService(strategy).prepare();

    expect(strategy.authenticate).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ establishedAt: expect.any(Number) as number }));
  });

  it('signs in once for calls that arrive together', async () => {
    const strategy = signingInStrategy();
    const service = new LifecareSessionService(strategy);

    await Promise.all([service.prepare(), service.prepare(), service.prepare()]);

    expect(strategy.authenticate).toHaveBeenCalledTimes(1);
  });
});
