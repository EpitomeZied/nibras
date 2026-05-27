import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createNibrasWebSession, ensureNibrasUserProfile } from '@/lib/nibras-session-bridge';
import { buildNibrasWebSessionCookie } from '@/lib/web-session-cookie';

function resolveNextUrl(request: NextRequest): string {
  const next = request.nextUrl.searchParams.get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/auth/complete';
  }
  return next;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    const signIn = new URL('/', request.url);
    signIn.searchParams.set('auth', 'required');
    return NextResponse.redirect(signIn);
  }

  const userId = session.user.id;
  await ensureNibrasUserProfile(userId);
  const webSessionToken = await createNibrasWebSession(userId);

  const nextPath = resolveNextUrl(request);
  const redirectUrl = new URL(nextPath, request.url);
  redirectUrl.searchParams.set('st', webSessionToken);

  const response = NextResponse.redirect(redirectUrl);
  const secure = process.env.NODE_ENV === 'production';
  response.headers.append(
    'Set-Cookie',
    buildNibrasWebSessionCookie(webSessionToken, { secure })
  );
  return response;
}
