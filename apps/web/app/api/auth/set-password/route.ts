import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  let body: { newPassword?: string };
  try {
    body = (await request.json()) as { newPassword?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: await headers(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not set password.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
