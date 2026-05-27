export const NIBRAS_WEB_SESSION_COOKIE = 'nibras_web_session';

const WEB_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function buildNibrasWebSessionCookie(
  token: string,
  options: { secure?: boolean; maxAgeSeconds?: number } = {}
): string {
  const secure = options.secure ?? process.env.NODE_ENV === 'production';
  const maxAge = options.maxAgeSeconds ?? WEB_SESSION_MAX_AGE_SECONDS;
  const parts = [
    `${NIBRAS_WEB_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    secure ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (secure) {
    parts.push('Secure');
  }
  if (maxAge > 0) {
    parts.push(`Max-Age=${maxAge}`);
  } else {
    parts.push('Max-Age=0');
  }
  return parts.join('; ');
}

export function webSessionBridgePath(): string {
  return '/api/nibras/session-bridge';
}
