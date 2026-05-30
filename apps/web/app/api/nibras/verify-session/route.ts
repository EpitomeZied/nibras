import { NextRequest, NextResponse } from 'next/server';
import { resolveServerApiBaseUrls } from '@/lib/api-internal-url';
import { getPublicWebOrigin } from '@/lib/public-origin';
import { NIBRAS_WEB_SESSION_COOKIE } from '@/lib/web-session-cookie';

export const dynamic = 'force-dynamic';

const VERIFY_TIMEOUT_MS = 10_000;

function getSessionToken(request: NextRequest): string | null {
  const fromQuery = request.nextUrl.searchParams.get('st');
  if (fromQuery) {
    return fromQuery;
  }
  return request.cookies.get(NIBRAS_WEB_SESSION_COOKIE)?.value ?? null;
}

async function fetchSessionFromApi(
  apiBaseUrl: string,
  sessionToken: string
): Promise<Response | null> {
  const apiUrl = `${apiBaseUrl}/v1/web/session`;
  try {
    return await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json({ error: 'Missing session token.' }, { status: 401 });
  }

  const webOrigin = getPublicWebOrigin(request);
  const candidates = resolveServerApiBaseUrls(webOrigin);

  let lastStatus = 503;
  let lastError = 'Unable to reach the Nibras API. Try signing in again.';

  for (const apiBaseUrl of candidates) {
    const apiResponse = await fetchSessionFromApi(apiBaseUrl, sessionToken);
    if (!apiResponse) {
      continue;
    }

    if (apiResponse.ok) {
      const payload = await apiResponse.json();
      return NextResponse.json(payload);
    }

    lastStatus = apiResponse.status;
    try {
      const payload = (await apiResponse.json()) as { error?: string };
      if (payload?.error) {
        lastError = payload.error;
      }
    } catch {
      lastError = 'Web session was not established.';
    }

    // Auth failures are definitive — no point trying other hosts.
    if (apiResponse.status === 401 || apiResponse.status === 403) {
      break;
    }
  }

  return NextResponse.json({ error: lastError }, { status: lastStatus });
}
