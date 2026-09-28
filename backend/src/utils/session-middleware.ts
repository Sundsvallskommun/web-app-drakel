import { NODE_ENV, SECRET_KEY, SESSION_MEMORY } from '@config';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import createFileStore from 'session-file-store';

/**
 * How long a session lives without a request. Rolling: every request starts the eight hours again, so a handläggare
 * working through the day stays signed in, while a session left alone ends the same working day.
 */
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

/** How often the in-memory store drops the sessions that have run out. */
const MEMORY_STORE_PRUNE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * The session store: in memory (SESSION_MEMORY) or as files. Both expire a session by its cookie's max age; the file
 * store is also given it as its ttl (seconds), which its reaper uses to delete the files of abandoned sessions.
 */
const createSessionStore = (): session.Store => {
  if (SESSION_MEMORY) {
    const MemoryStore = createMemoryStore(session);
    return new MemoryStore({ checkPeriod: MEMORY_STORE_PRUNE_INTERVAL_MS, ttl: SESSION_MAX_AGE_MS });
  }
  const FileStore = createFileStore(session);
  return new FileStore({ ttl: SESSION_MAX_AGE_MS / 1000, path: './data/sessions' });
};

/**
 * The session middleware. The cookie is out of reach of script (httpOnly), is not sent on cross-site subrequests
 * (SameSite=Lax — the IdP's login POST does not need it: it creates the session), and in production goes over HTTPS
 * only. Behind the reverse proxy Express learns that the request came in over HTTPS from X-Forwarded-Proto, which it
 * reads because the app trusts the proxy (see `trust proxy` in app.ts) — without that, a secure cookie is never set.
 */
export const sessionMiddleware = () =>
  session({
    // Unique cookie name so drakel's session doesn't clash with other apps running on
    // localhost (cookies ignore the port, so a shared `connect.sid` would get clobbered).
    name: 'drakel.sid',
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: createSessionStore(),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_MS,
    },
  });
