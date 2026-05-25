import { PrismaClient, CompPlatform } from '@prisma/client';
import { syncLinkedAccountAura } from '../lib/sync-linked-account-aura';
import { syncSingleAccount } from './account-stats-sync';

type FetcherModule = {
  fetchers: Record<
    string,
    {
      verifyHandle(
        handle: string
      ): Promise<{ valid: boolean; rating?: number; maxRating?: number }>;
    }
  >;
};

let _fetchers: FetcherModule | null = null;
async function loadFetchers(): Promise<FetcherModule> {
  if (!_fetchers) {
    _fetchers = (await import('../fetchers/index')) as FetcherModule;
  }
  return _fetchers;
}

function log(level: string, msg: string, extra?: Record<string, unknown>) {
  process.stdout.write(
    JSON.stringify({ level, time: new Date().toISOString(), msg, ...extra }) + '\n'
  );
}

export async function runAccountVerify(
  prisma: PrismaClient,
  userId: string,
  platform: string,
  handle: string
): Promise<void> {
  const { fetchers } = await loadFetchers();
  const fetcher = fetchers[platform];
  if (!fetcher) {
    log('warn', `No fetcher for platform: ${platform}`);
    return;
  }

  try {
    const result = await fetcher.verifyHandle(handle);

    const account = await prisma.linkedAccount.update({
      where: {
        userId_platform: { userId, platform: platform as CompPlatform },
      },
      data: {
        verificationStatus: result.valid ? 'verified' : 'failed',
        verifiedAt: result.valid ? new Date() : null,
        platformRating: result.rating ?? null,
        platformMaxRating: result.maxRating ?? null,
      },
    });

    log('info', `Account verify: ${platform}/${handle} — ${result.valid ? 'verified' : 'failed'}`, {
      userId,
      platform,
      handle,
      valid: result.valid,
    });

    if (result.valid) {
      await syncLinkedAccountAura(prisma, userId, { platform: platform as CompPlatform });

      try {
        await syncSingleAccount(prisma, {
          id: account.id,
          userId,
          platform: platform as CompPlatform,
          handle,
        });
        log('info', `Immediate stats sync after verify: ${platform}/${handle}`, {
          userId,
          platform,
        });
      } catch (syncErr) {
        const syncMsg = syncErr instanceof Error ? syncErr.message : String(syncErr);
        log('warn', `Immediate stats sync failed (non-fatal): ${platform}/${handle}`, {
          userId,
          error: syncMsg,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('warn', `Account verify failed: ${platform}/${handle}`, {
      userId,
      platform,
      error: message,
    });

    await prisma.linkedAccount.update({
      where: {
        userId_platform: { userId, platform: platform as CompPlatform },
      },
      data: { verificationStatus: 'failed' },
    });
  }
}
