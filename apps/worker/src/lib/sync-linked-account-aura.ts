/**
 * Mirror of apps/api/src/features/reputation/linked-account-aura.ts — keep in sync.
 */
import type { CompPlatform, PrismaClient } from '@prisma/client';

export const AURA_RATING_MULTIPLIER = 2;

const PLATFORM_LABELS: Record<string, string> = {
  codeforces: 'Codeforces',
  leetcode: 'LeetCode',
  atcoder: 'AtCoder',
  codechef: 'CodeChef',
  ctftime: 'CTFtime',
  kaggle: 'Kaggle',
  hackthebox: 'Hack The Box',
  tryhackme: 'TryHackMe',
  picoctf: 'picoCTF',
  project_euler: 'Project Euler',
  hackerone: 'HackerOne',
  bugcrowd: 'Bugcrowd',
  defcon: 'DEF CON CTF',
};

function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

function computeAuraDelta(rating: number | null | undefined): number {
  return Math.max(0, (rating ?? 0) * AURA_RATING_MULTIPLIER);
}

function buildLinkedAccountAuraReason(
  platform: string,
  rating: number | null | undefined
): string {
  const label = platformLabel(platform);
  const r = rating ?? 0;
  const aura = computeAuraDelta(rating);
  if (r > 0) {
    return `Linked ${label} account (${r} rating → ${aura} Aura)`;
  }
  return `Linked ${label} account`;
}

export async function syncLinkedAccountAura(
  prisma: PrismaClient,
  userId: string,
  opts?: { platform?: CompPlatform }
): Promise<void> {
  const accounts = await prisma.linkedAccount.findMany({
    where: {
      userId,
      verificationStatus: 'verified',
      ...(opts?.platform ? { platform: opts.platform } : {}),
    },
    select: {
      platform: true,
      platformRating: true,
      verifiedAt: true,
    },
  });

  for (const account of accounts) {
    const delta = computeAuraDelta(account.platformRating);
    const source = `linked-account:${account.platform}`;
    const reason = buildLinkedAccountAuraReason(account.platform, account.platformRating);

    await prisma.reputationEvent.upsert({
      where: { userId_source: { userId, source } },
      create: {
        userId,
        delta,
        reason,
        source,
        category: 'contest',
        createdAt: account.verifiedAt ?? new Date(),
      },
      update: { delta, reason },
    });
  }
}
