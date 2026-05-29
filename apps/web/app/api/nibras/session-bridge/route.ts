import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createNibrasWebSession, ensureNibrasUserProfile } from '@/lib/nibras-session-bridge';
import { getPublicWebOrigin, sanitizeNextPath } from '@/lib/public-origin';
import { buildNibrasWebSessionCookie } from '@/lib/web-session-cookie';

function resolveNextPath(request: NextRequest): string {
  return sanitizeNextPath(request.nextUrl.searchParams.get('next'), '/dashboard');
}

function redirectWithError(publicOrigin: string, code: string): NextResponse {
  const url = new URL('/', publicOrigin);
  url.searchParams.set('error', code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const publicOrigin = getPublicWebOrigin(request);

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      const signIn = new URL('/', publicOrigin);
      signIn.searchParams.set('auth', 'required');
      return NextResponse.redirect(signIn);
    }

    const effectiveUserId = await ensureNibrasUserProfile(session.user.id);
    const webSessionToken = await createNibrasWebSession(effectiveUserId);

    const nextPath = resolveNextPath(request);
    const redirectUrl = new URL('/auth/complete', publicOrigin);
    redirectUrl.searchParams.set('st', webSessionToken);
    redirectUrl.searchParams.set('next', nextPath);

    const response = NextResponse.redirect(redirectUrl);
    const secure = process.env.NODE_ENV === 'production';
    response.headers.append('Set-Cookie', buildNibrasWebSessionCookie(webSessionToken, { secure }));
    return response;
  } catch (err) {
    console.error('[session-bridge]', err);
    return redirectWithError(publicOrigin, 'session_bridge_failed');
  }
}
