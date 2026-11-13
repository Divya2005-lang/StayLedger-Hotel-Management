/**
 * Counts failed sign-ins per key (the client IP) inside a time window.
 * After `max` failures the key is blocked until the window ends.
 */
export function createLimiter({ windowMs, max, now = () => Date.now() }) {
  const entries = new Map();

  const live = (key) => {
    const entry = entries.get(key);
    if (!entry) return null;
    if (entry.resetAt <= now()) {
      entries.delete(key);
      return null;
    }
    return entry;
  };

  return {
    /** Milliseconds the key must still wait, or 0 when it may try. */
    retryAfterMs(key) {
      const entry = live(key);
      return entry && entry.count >= max ? entry.resetAt - now() : 0;
    },
    fail(key) {
      const entry = live(key);
      if (entry) entry.count += 1;
      else entries.set(key, { count: 1, resetAt: now() + windowMs });
      if (entries.size > 5000) for (const k of [...entries.keys()]) live(k); // drop expired keys
    },
    clear(key) {
      entries.delete(key);
    },
  };
}
