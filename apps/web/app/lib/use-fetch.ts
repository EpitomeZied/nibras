'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './session';
import {
  buildCacheKey,
  cachedGet,
  invalidateRequestCache,
  shouldCacheApiPath,
} from './request-cache';

export function useFetch<T>(
  path: string | null,
  options?: { auth?: boolean; deps?: unknown[] }
): { data: T | null; loading: boolean; error: string; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => {
    if (path !== null) {
      invalidateRequestCache(buildCacheKey(['api', path, String(options?.auth ?? true)]));
    }
    setRevision((r) => r + 1);
  }, [path, options?.auth]);

  useEffect(() => {
    if (path === null) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError('');

    const auth = options?.auth ?? true;
    const cacheKey = buildCacheKey(['api', path, String(auth)]);

    void (async () => {
      try {
        const fetchPayload = async (): Promise<T> => {
          const res = await apiFetch(path, { auth });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error ?? `Request failed (${res.status})`);
          }
          return (await res.json()) as T;
        };

        const payload = shouldCacheApiPath(path)
          ? await cachedGet(cacheKey, fetchPayload)
          : await fetchPayload();

        if (alive) setData(payload);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, revision, ...(options?.deps ?? [])]);

  return { data, loading, error, reload };
}
