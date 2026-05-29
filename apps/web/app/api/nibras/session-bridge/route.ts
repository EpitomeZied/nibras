import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createNibrasWebSession, ensureNibrasUserProfile } from '@/lib/nibras-session-bridge';
import { getPublicWebOrigin, sanitizeNextPath } from '@/lib/public-origin';
import { buildNibrasWebSessionCookie } from '@/lib/web-session-cookie';

function resolveNextPath(request: NextRequest): string {
  return sanitizeNextPath(request.nextUrl.searchParams.get('next'), '/dashboard');
}

export async function GET(request: NextRequest) {
  const publicOrigin = getPublicWebOrigin(request);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    const signIn = new URL('/', publicOrigin);
    signIn.searchParams.set('auth', 'required');
    return NextResponse.redirect(signIn);
  }

  const userId = session.user.id;
  await ensureNibrasUserProfile(userId);
  const webSessionToken = await createNibrasWebSession(userId);

  const nextPath = resolveNextPath(request);
  const redirectUrl = new URL('/auth/complete', publicOrigin);
  redirectUrl.searchParams.set('st', webSessionToken);
  redirectUrl.searchParams.set('next', nextPath);

  const response = NextResponse.redirect(redirectUrl);
  const secure = process.env.NODE_ENV === 'production';
  response.headers.append('Set-Cookie', buildNibrasWebSessionCookie(webSessionToken, { secure }));
  return response;
}
