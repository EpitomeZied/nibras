type CacheEntry = {
  data: unknown;
  at: number;
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

export const DEFAULT_REQUEST_CACHE_TTL_MS = 45_000;

const NO_CACHE_PATH_PREFIXES = ['/v1/web/session', '/v1/web/logout', '/v1/notifications'];

export function buildCacheKey(parts: string[]): string {
  return parts.join('::');
}

export function shouldCacheApiPath(path: string): boolean {
  return !NO_CACHE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function peekCached<T>(key: string, ttlMs = DEFAULT_REQUEST_CACHE_TTL_MS): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.at < ttlMs) {
    return entry.data as T;
  }
  return null;
}

export async function cachedGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttlMs?: number; force?: boolean }
): Promise<T> {
  const ttlMs = options?.ttlMs ?? DEFAULT_REQUEST_CACHE_TTL_MS;

  if (!options?.force) {
    const cached = peekCached<T>(key, ttlMs);
    if (cached !== null) return cached;

    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, at: Date.now() });
      return data;
    })
    .finally(() => {
      if (inFlight.get(key) === promise) {
        inFlight.delete(key);
      }
    });

  inFlight.set(key, promise);
  return promise;
}

export function invalidateRequestCache(keyOrPrefix?: string): void {
  if (!keyOrPrefix) {
    cache.clear();
    inFlight.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      cache.delete(key);
    }
  }
  for (const key of inFlight.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      inFlight.delete(key);
    }
  }
}
