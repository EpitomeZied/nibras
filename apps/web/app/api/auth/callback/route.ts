import { NextRequest, NextResponse } from 'next/server';
import { getPublicWebOrigin } from '@/lib/public-origin';

export const dynamic = 'force-dynamic';

/**
 * OAuth callback handler — runs server-side to avoid cross-origin cookie issues.
 *
 * GitHub redirects here after the user authorises the app. We forward the
 * code + state to the real API backend (server-to-server, no browser cookies
 * involved), receive the session token via Set-Cookie, and re-issue that
 * cookie on the web domain so all subsequent same-origin API calls (via the
 * /v1/* Next.js rewrite) can include it automatically.
 *
 * GitHub App callback URL should be:
 *   https://<web-host>/api/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const publicOrigin = getPublicWebOrigin(request);

  if (!code || !state) {
    return NextResponse.redirect(`${publicOrigin}/?auth=required`);
  }

  const apiInternalUrl = process.env.NIBRAS_API_INTERNAL_URL || 'https://nibras-api.fly.dev';

  const callbackUrl =
    `${apiInternalUrl}/v1/github/oauth/callback` +
    `?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

  let apiResponse: Response;
  try {
    apiResponse = await fetch(callbackUrl, {
      redirect: 'manual',
    });
  } catch {
    return NextResponse.redirect(`${publicOrigin}/?auth=required`);
  }

  const setCookie = apiResponse.headers.get('set-cookie');
  const location = apiResponse.headers.get('location');

  let sessionToken: string | null = null;
  if (location) {
    try {
      sessionToken = new URL(location).searchParams.get('st');
    } catch {
      /* malformed URL */
    }
  }

  const completePath = `/auth/complete${sessionToken ? `?st=${encodeURIComponent(sessionToken)}` : ''}`;
  const redirectTo = `${publicOrigin}${completePath}`;

  const response = NextResponse.redirect(redirectTo);

  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }

  return response;
}
