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

/**
 * Ordered API base URLs for server-side route handlers (verify-session, OAuth callback).
 * Tries explicit env vars first, then Azure Container Apps in-environment DNS, then Docker Compose.
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

  const internal = normalizeBaseUrl(process.env.NIBRAS_API_INTERNAL_URL);
  if (internal) {
    push(internal);
  }

  const apiBase = normalizeBaseUrl(process.env.NIBRAS_API_BASE_URL);
  if (apiBase && apiBase !== webOrigin && hostFromUrl(apiBase) !== webHost) {
    push(apiBase);
  }

  // Azure Container Apps: apps in the same environment reach each other by name.
  const azureApiPort = process.env.NIBRAS_API_PORT || '8080';
  push(`http://nibras-api:${azureApiPort}`);

  // Docker Compose production stack.
  push('http://api:4848');

  return candidates;
}
