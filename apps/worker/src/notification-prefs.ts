import type { PrismaClient } from '@prisma/client';

/** Returns true when the user has not disabled this email preference (default on). */
export async function isEmailPreferenceEnabled(
  prisma: PrismaClient,
  userId: string,
  type: string
): Promise<boolean> {
  const row = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId, type } },
    select: { enabled: true },
  });
  return row?.enabled ?? true;
}
