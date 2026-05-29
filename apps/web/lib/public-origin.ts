/** Public web origin for redirects behind Fly/Azure proxies (never use request.url). */
export function getPublicWebOrigin(request: { headers: Headers }): string {
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const forwardedHost =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return (
    process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL ??
    process.env.NIBRAS_WEB_BASE_URL ??
    'https://nibrasplatform.me'
  ).replace(/\/$/, '');
}

/** Safe in-app path for post-auth redirects (no open redirects). */
export function sanitizeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }
  return next;
}
