// Ambient declarations for dependencies that ship no types.

// class-transformer exposes its metadata storage only via this internal CJS path; it is the
// documented way to feed defaultMetadataStorage into class-validator-jsonschema.
declare module 'class-transformer/cjs/storage' {
  // class-transformer ships the type at types/storage but the runtime entry is cjs/storage.
  export { defaultMetadataStorage } from 'class-transformer/types/storage';
}

// session-file-store ships no types; we only use it as an express-session store factory.
declare module 'session-file-store' {
  import type { Store } from 'express-session';
  import type session from 'express-session';
  type SessionFileStore = (s: typeof session) => new (options?: Record<string, unknown>) => Store;
  const createFileStore: SessionFileStore;
  export default createFileStore;
}
