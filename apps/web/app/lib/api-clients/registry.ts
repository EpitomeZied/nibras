/**
 * Multi-backend service URL registry.
 *
 * Services that have been migrated to the local Prisma-backed API (admin,
 * community, tracking, competitions) default to the page origin so requests
 * go through the Next.js `/v1/*` rewrite proxy — keeping cookies same-origin
 * and hitting the correct session store. The recommendation service still
 * points to its external Railway backend.
 *
 * Resolution priority:
 *   1. `?<service>Api=URL` query string parameter (debug per-tab override)
 *   2. `localStorage.nibras_<service>_api_url`
 *   3. `NEXT_PUBLIC_NIBRAS_<SERVICE>_API_URL` env var
 *   4. Page origin (migrated services) or hard-coded external URL
 */
export type ApiServiceName =
  | 'admin'
  | 'community'
  | 'tracking'
  | 'competitions'
  | 'recommendation';

function getPageOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_NIBRAS_API_BASE_URL || 'http://localhost:4848';
}

const DEFAULT_SERVICE_URLS: Record<ApiServiceName, () => string> = {
  admin: getPageOrigin,
  community: getPageOrigin,
  tracking: getPageOrigin,
  competitions: getPageOrigin,
  recommendation: () => 'https://recommendationmodel-production-0f8e.up.railway.app/api',
};

const ENV_KEYS: Record<ApiServiceName, string> = {
  admin: 'NEXT_PUBLIC_NIBRAS_ADMIN_API_URL',
  community: 'NEXT_PUBLIC_NIBRAS_COMMUNITY_API_URL',
  tracking: 'NEXT_PUBLIC_NIBRAS_TRACKING_API_URL',
  competitions: 'NEXT_PUBLIC_NIBRAS_COMPETITIONS_API_URL',
  recommendation: 'NEXT_PUBLIC_NIBRAS_RECOMMENDATION_API_URL',
};

const QUERY_KEYS: Record<ApiServiceName, readonly string[]> = {
  admin: ['adminApi', 'api'],
  community: ['communityApi', 'discussionsApi'],
  tracking: ['trackingApi', 'trackApi'],
  competitions: ['competitionsApi', 'compApi'],
  recommendation: ['recommendationApi', 'recommendApi', 'recApi'],
};

const STORAGE_KEYS: Record<ApiServiceName, string> = {
  admin: 'nibras_admin_api_url',
  community: 'nibras_community_api_url',
  tracking: 'nibras_tracking_api_url',
  competitions: 'nibras_competitions_api_url',
  recommendation: 'nibras_recommendation_api_url',
};

function normalize(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : null;
}

function readEnv(service: ApiServiceName): string | null {
  const envKey = ENV_KEYS[service];
  const raw = (process.env as Record<string, string | undefined>)[envKey];
  return normalize(raw);
}

function readQuery(service: ApiServiceName): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  for (const key of QUERY_KEYS[service]) {
    const value = params.get(key);
    const normalized = normalize(value);
    if (normalized) return normalized;
  }
  return null;
}

function readStorage(service: ApiServiceName): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalize(window.localStorage.getItem(STORAGE_KEYS[service]));
  } catch {
    return null;
  }
}

export function resolveServiceBaseUrl(service: ApiServiceName): string {
  return (
    readQuery(service) ??
    readStorage(service) ??
    readEnv(service) ??
    DEFAULT_SERVICE_URLS[service]()
  );
}

export function getDefaultServiceBaseUrl(service: ApiServiceName): string {
  return DEFAULT_SERVICE_URLS[service]();
}

export function getAllServiceBaseUrls(): Record<ApiServiceName, string> {
  return {
    admin: resolveServiceBaseUrl('admin'),
    community: resolveServiceBaseUrl('community'),
    tracking: resolveServiceBaseUrl('tracking'),
    competitions: resolveServiceBaseUrl('competitions'),
    recommendation: resolveServiceBaseUrl('recommendation'),
  };
}
