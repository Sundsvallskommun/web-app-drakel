/** Runs work for a key once the work already queued for the same key has settled. */
type RunExclusively = <T>(key: string, work: () => Promise<T>) => Promise<T>;

/**
 * An in-process lock per key: work for one key runs one at a time, in the order it arrived, while work for different
 * keys runs side by side. A failure does not hold up the work queued after it. Only this process is covered — enough
 * for a double-click or two tabs against the one BFF instance.
 */
export const createKeyedLock = (): RunExclusively => {
  // The last piece of work queued per key; a key is dropped once its queue has run empty.
  const queueTails = new Map<string, Promise<unknown>>();

  return async <T>(key: string, work: () => Promise<T>): Promise<T> => {
    // A tail never rejects (see below), so the work always runs once the one before it has settled.
    const previous = queueTails.get(key) ?? Promise.resolve();
    const current = previous.then(() => work());
    const tail = current.catch(() => undefined);
    queueTails.set(key, tail);
    try {
      return await current;
    } finally {
      if (queueTails.get(key) === tail) {
        queueTails.delete(key);
      }
    }
  };
};
