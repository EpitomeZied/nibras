import { NextResponse } from 'next/server';
import { getAuthProvidersConfig } from '@/lib/auth-providers-server';

export const dynamic = 'force-dynamic';

/** Runtime auth provider flags (secrets stay server-side). */
export async function GET() {
  const providers = getAuthProvidersConfig();
  return NextResponse.json({
    ...providers,
    githubEnabled: providers.github,
  });
}
