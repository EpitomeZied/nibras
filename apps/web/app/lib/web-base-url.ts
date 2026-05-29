/** Canonical production site URL (trailing slash). */
export const WEB_BASE_URL = (
  process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL ??
  process.env.NEXT_PUBLIC_WEB_BASE_URL ??
  'https://nibrasplatform.me'
).replace(/\/$/, '');

export function absoluteSiteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${WEB_BASE_URL}${normalized}`;
}
