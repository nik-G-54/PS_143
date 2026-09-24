// src/services/sharedRequest.ts
//
// One in-flight/recent request per key, shared by every caller. Lets the map's
// hooks and the evidence report's background preparation ask for the same
// backend resource without downloading it twice: whoever asks first starts
// the request, everyone after reuses the same promise for `TTL_MS`.
//
// Deliberately takes no AbortSignal: a shared request must not be cancelled
// by one of several consumers. Callers that go away simply ignore the result
// (the map hooks already guard with their own `active` flags).

const TTL_MS = 5 * 60_000;

const entries = new Map<string, { promise: Promise<unknown>; at: number }>();

export function sharedRequest<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = entries.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise as Promise<T>;

  const promise = load();
  entries.set(key, { promise, at: Date.now() });
  // Failures are never cached — the next caller retries.
  promise.catch(() => {
    if (entries.get(key)?.promise === promise) entries.delete(key);
  });
  return promise;
}
