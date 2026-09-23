import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { logger } from '@utils/logger';

/**
 * One Lifecare session, as it is kept on disk between BFF restarts.
 *
 * `establishedAt` is when it was signed in, so its age (and the TTL) survive a restart — a session
 * loaded from disk is not treated as brand new.
 */
export interface PersistedLifecareSession {
  cookies: [string, string][];
  establishedAt: number;
}

/**
 * Where the session is kept: beside the express-session files the app already writes, under the
 * gitignored `data/` folder. `__dirname` is `dist/utils` in production and `src/utils` under
 * ts-node, and `../../data` resolves to `backend/data` from both.
 *
 * The file holds a live Lifecare session — LEGACY-TOKEN, ASP.NET_SessionId — so it is a credential
 * at rest. It lives here for the same reason the app's own session files do, and must be protected
 * the same way; it is never committed (data/ is gitignored).
 */
const SESSION_FILE = join(__dirname, '../../data/lifecare-session.json');

/** Whether a parsed value is the shape we wrote — a bad or half-written file is treated as none. */
const isPersistedSession = (value: unknown): value is PersistedLifecareSession => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.establishedAt !== 'number') return false;
  if (!Array.isArray(candidate.cookies)) return false;
  return candidate.cookies.every(entry => Array.isArray(entry) && entry.length === 2 && entry.every(part => typeof part === 'string'));
};

/** The persisted session, or undefined when there is none (or the file cannot be trusted). */
export const loadPersistedSession = (): PersistedLifecareSession | undefined => {
  try {
    if (!existsSync(SESSION_FILE)) return undefined;
    const parsed: unknown = JSON.parse(readFileSync(SESSION_FILE, 'utf8'));
    return isPersistedSession(parsed) ? parsed : undefined;
  } catch (error) {
    logger.warn(`Could not read the persisted Lifecare session: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
};

/** Writes the session to disk, replacing what was there. A failure is logged, never thrown. */
export const savePersistedSession = (session: PersistedLifecareSession): void => {
  try {
    const directory = dirname(SESSION_FILE);
    if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
    writeFileSync(SESSION_FILE, JSON.stringify(session), 'utf8');
  } catch (error) {
    logger.warn(`Could not persist the Lifecare session: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/** Removes the persisted session, so a session known to be dead is not reloaded on a restart. */
export const clearPersistedSession = (): void => {
  try {
    rmSync(SESSION_FILE, { force: true });
  } catch (error) {
    logger.warn(`Could not clear the persisted Lifecare session: ${error instanceof Error ? error.message : String(error)}`);
  }
};
