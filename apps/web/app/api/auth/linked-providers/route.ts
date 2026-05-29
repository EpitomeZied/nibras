import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ providers: [] as string[] });
  }

  const accounts: { providerId: string }[] = await prisma.authAccount.findMany({
    where: { userId: session.user.id },
    select: { providerId: true },
  });

  return NextResponse.json({
    providers: accounts.map((account) => account.providerId),
  });
}
