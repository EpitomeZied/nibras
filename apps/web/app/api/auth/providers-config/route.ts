import { NextResponse } from 'next/server';

/** Runtime auth provider flags (secrets are server-only; not exposed). */
export async function GET() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
  const githubEnabled = Boolean(
    process.env.GITHUB_APP_CLIENT_ID?.trim() && process.env.GITHUB_APP_CLIENT_SECRET?.trim()
  );
  return NextResponse.json({ googleEnabled, githubEnabled });
}
