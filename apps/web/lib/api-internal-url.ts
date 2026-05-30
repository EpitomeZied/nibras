/** Strip trailing slashes from a URL origin/base. */
function normalizeBaseUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  try {
    const url = new URL(value.trim());
    const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    if (pathname && pathname !== '/') {
      return `${url.origin}${pathname}`;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function hostFromUrl(value: string | null | undefined): string | null {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) {
    return null;
  }
  try {
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

function isAzureContainerApp(): boolean {
  return Boolean(process.env.CONTAINER_APP_NAME);
}

/**
 * Ordered API base URLs for server-side route handlers (verify-session, OAuth callback).
 * On Azure Container Apps, in-environment calls must use HTTP by app name (HTTPS times out).
 */
export function resolveServerApiBaseUrls(webOrigin?: string | null): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  function push(value: string | null | undefined) {
    const normalized = normalizeBaseUrl(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    candidates.push(normalized);
  }

  const webHost = hostFromUrl(webOrigin);

  // Azure: HTTP by app name is the reliable in-environment path (HTTPS internal calls hang).
  if (isAzureContainerApp()) {
    push('http://nibras-api');
    const azureApiPort = process.env.NIBRAS_API_PORT || '8080';
    push(`http://nibras-api:${azureApiPort}`);
  }

  const internal = normalizeBaseUrl(process.env.NIBRAS_API_INTERNAL_URL);
  if (internal) {
    push(internal);
  }

  const apiBase = normalizeBaseUrl(process.env.NIBRAS_API_BASE_URL);
  if (apiBase && apiBase !== webOrigin && hostFromUrl(apiBase) !== webHost) {
    push(apiBase);
  }

  if (!isAzureContainerApp()) {
    push('http://nibras-api:8080');
  }

  // Docker Compose production stack.
  push('http://api:4848');

  return candidates;
}

/** Per-candidate fetch budget: generous for the first host, short for fallbacks. */
export function resolveCandidateTimeoutMs(index: number, remainingMs: number): number {
  const preferred = index === 0 ? 20_000 : 3_000;
  return Math.max(500, Math.min(preferred, remainingMs));
}

export const SERVER_API_VERIFY_DEADLINE_MS = 25_000;
