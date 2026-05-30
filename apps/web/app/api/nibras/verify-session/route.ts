import { NextRequest, NextResponse } from 'next/server';
import {
  resolveCandidateTimeoutMs,
  resolveServerApiBaseUrls,
  SERVER_API_VERIFY_DEADLINE_MS,
} from '@/lib/api-internal-url';
import { getPublicWebOrigin } from '@/lib/public-origin';
import { resolvePublicApiBaseUrl, resolveWebSessionMeResponse } from '@/lib/verify-web-session';
import { NIBRAS_WEB_SESSION_COOKIE } from '@/lib/web-session-cookie';

export const dynamic = 'force-dynamic';

const API_TRANSPORT_ERROR =
  'Could not reach the Nibras API to verify your session. Try signing in again.';

function getSessionToken(request: NextRequest): string | null {
  const fromQuery = request.nextUrl.searchParams.get('st');
  if (fromQuery) {
    return fromQuery;
  }
  return request.cookies.get(NIBRAS_WEB_SESSION_COOKIE)?.value ?? null;
}

function remainingMs(deadlineMs: number): number {
  return Math.max(0, deadlineMs - Date.now());
}

async function fetchSessionFromApi(
  apiBaseUrl: string,
  sessionToken: string,
  timeoutMs: number
): Promise<Response | null> {
  const apiUrl = `${apiBaseUrl}/v1/web/session`;
  try {
    return await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      signal: AbortSignal.timeout(timeoutMs),
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
  const apiBaseUrl = resolvePublicApiBaseUrl(webOrigin);

  const localSession = await resolveWebSessionMeResponse(sessionToken, apiBaseUrl);
  if (localSession) {
    return NextResponse.json(localSession);
  }

  const candidates = resolveServerApiBaseUrls(webOrigin);
  const deadlineMs = Date.now() + SERVER_API_VERIFY_DEADLINE_MS;

  let lastStatus = 503;
  let lastError = 'Unable to reach the Nibras API. Try signing in again.';

  for (let index = 0; index < candidates.length; index++) {
    const budget = remainingMs(deadlineMs);
    if (budget <= 0) {
      break;
    }

    const candidateBaseUrl = candidates[index];
    const timeoutMs = resolveCandidateTimeoutMs(index, budget);
    const apiResponse = await fetchSessionFromApi(candidateBaseUrl, sessionToken, timeoutMs);
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
      lastError = API_TRANSPORT_ERROR;
    }

    // Auth failures are definitive — no point trying other hosts.
    if (apiResponse.status === 401 || apiResponse.status === 403) {
      break;
    }
  }

  if (remainingMs(deadlineMs) <= 0) {
    lastError = 'Session verification timed out — try signing in again.';
    lastStatus = 504;
  }

  return NextResponse.json({ error: lastError }, { status: lastStatus });
}
