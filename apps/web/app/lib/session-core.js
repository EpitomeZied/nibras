function normalizePathname(pathname) {
  if (!pathname || pathname === '/') {
    return '';
  }
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function normalizeApiBaseUrl(value) {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return `${url.origin}${normalizePathname(url.pathname)}`;
  } catch {
    return null;
  }
}

export function isLoopbackUrl(value) {
  const normalized = normalizeApiBaseUrl(value);
  if (!normalized) {
    return false;
  }
  const url = new URL(normalized);
  return url.hostname === '127.0.0.1' || url.hostname === 'localhost';
}

export function shouldIgnoreStoredApiBaseUrlForOrigin(pageOrigin, value) {
  const normalizedOrigin = normalizeApiBaseUrl(pageOrigin);
  if (!normalizedOrigin) {
    return false;
  }
  return (
    normalizedOrigin.startsWith('https://') &&
    !isLoopbackUrl(normalizedOrigin) &&
    isLoopbackUrl(value)
  );
}

export function shouldIgnoreConfiguredApiBaseUrlForOrigin(pageOrigin, configuredApiBaseUrl) {
  // On a loopback origin (local dev), skip public HTTPS configured URLs — they are
  // likely stale production values baked into the build and irrelevant locally.
  return isLoopbackUrl(pageOrigin) && !isLoopbackUrl(configuredApiBaseUrl ?? '');
}

export function buildApiBaseUrlCandidates({ pageOrigin, storedApiBaseUrl, configuredApiBaseUrl }) {
  const candidates = [];
  const seen = new Set();

  function push(value) {
    const normalized = normalizeApiBaseUrl(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    candidates.push(normalized);
  }

  if (storedApiBaseUrl) {
    // A stored URL means the user has previously connected successfully from this
    // browser.  Prefer same-origin first (local proxy dev mode), then the stored URL,
    // then the static configured fallback.
    push(pageOrigin);
    if (!shouldIgnoreStoredApiBaseUrlForOrigin(pageOrigin, storedApiBaseUrl)) {
      push(storedApiBaseUrl);
    }
    if (!shouldIgnoreConfiguredApiBaseUrlForOrigin(pageOrigin, configuredApiBaseUrl)) {
      push(configuredApiBaseUrl);
    }
  } else {
    // No stored URL — first-time user or cleared storage.  Trust the configured
    // build-time URL first (correct for production split-domain deployments), then
    // fall back to same-origin (local proxy dev mode where no env var is set).
    if (!shouldIgnoreConfiguredApiBaseUrlForOrigin(pageOrigin, configuredApiBaseUrl)) {
      push(configuredApiBaseUrl);
    }
    push(pageOrigin);
  }

  return candidates;
}

export function formatApiDiscoveryError(candidates) {
  const attempted = candidates.length > 0 ? candidates.join(', ') : 'no API base URLs';
  return `Unable to reach the Nibras API. Tried: ${attempted}. Start \`npm run api:dev\` for local API access, start \`npm run proxy:dev\` for same-origin proxy access, or update \`.env\` and your tunnel URL before signing in again.`;
}

export async function discoverApiBaseUrlWith({
  pageOrigin,
  storedApiBaseUrl,
  configuredApiBaseUrl,
  probe,
  persistApiBaseUrl,
}) {
  const candidates = buildApiBaseUrlCandidates({
    pageOrigin,
    storedApiBaseUrl,
    configuredApiBaseUrl,
  });

  for (const candidate of candidates) {
    try {
      if (await probe(candidate)) {
        if (persistApiBaseUrl) {
          await persistApiBaseUrl(candidate);
        }
        return candidate;
      }
    } catch {
      // Try the next candidate before surfacing a connectivity error.
    }
  }

  throw new Error(formatApiDiscoveryError(candidates));
}

export function createApiUrl(apiBaseUrl, path) {
  const normalizedBase = normalizeApiBaseUrl(apiBaseUrl);
  if (!normalizedBase) {
    throw new Error(`Invalid API base URL: ${String(apiBaseUrl)}`);
  }
  return new URL(path, `${normalizedBase}/`).toString();
}

export function formatApiFetchError(apiBaseUrl) {
  return `Unable to reach the Nibras API at ${apiBaseUrl}. Start \`npm run api:dev\` for local API access, start \`npm run proxy:dev\` for same-origin proxy access, or update \`.env\` and your tunnel URL.`;
}

// Azure dashboard/home queries can take ~8s; keep headroom above that.
export const DEFAULT_FETCH_TIMEOUT_MS = 25_000;

export async function fetchWithTimeout(url, init = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
  return fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

export async function apiFetchWith({
  path,
  init = {},
  auth = false,
  discoverApiBaseUrl,
  fetchImpl,
  accessToken,
  fetchTimeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
}) {
  const apiBaseUrl = await discoverApiBaseUrl();
  const headers = new Headers(init.headers ?? undefined);
  if (auth && accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }

  let response;
  try {
    response = await fetchImpl(createApiUrl(apiBaseUrl, path), {
      ...init,
      headers,
      credentials: auth ? 'include' : init.credentials,
      signal: init.signal ?? AbortSignal.timeout(fetchTimeoutMs),
    });
  } catch {
    throw new Error(formatApiFetchError(apiBaseUrl));
  }

  if (response.ok) {
    return response;
  }

  try {
    const payload = await response.clone().json();
    if (
      payload &&
      typeof payload === 'object' &&
      typeof payload.error === 'string' &&
      payload.error
    ) {
      throw new Error(payload.error);
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'SyntaxError') {
      throw error;
    }
  }

  throw new Error(`HTTP ${response.status}`);
}
