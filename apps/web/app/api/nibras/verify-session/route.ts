import { NextRequest, NextResponse } from 'next/server';
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

function apiInternalUrl(): string {
  return process.env.NIBRAS_API_INTERNAL_URL || 'http://api:4848';
}

export async function GET(request: NextRequest) {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json({ error: 'Missing session token.' }, { status: 401 });
  }

  const apiUrl = `${apiInternalUrl()}/v1/web/session`;

  let apiResponse: Response;
  try {
    apiResponse = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the Nibras API. Try signing in again.' },
      { status: 503 }
    );
  }

  if (!apiResponse.ok) {
    let error = 'Web session was not established.';
    try {
      const payload = (await apiResponse.json()) as { error?: string };
      if (payload?.error) {
        error = payload.error;
      }
    } catch {
      /* use default */
    }
    return NextResponse.json({ error }, { status: apiResponse.status });
  }

  const payload = await apiResponse.json();
  return NextResponse.json(payload);
}
