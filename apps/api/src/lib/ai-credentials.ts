import { encrypt, decrypt } from '@nibras/core';
import type { PrismaClient } from '@prisma/client';

export const OPENAI_MODEL_OPTIONS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
  'gpt-4.1',
] as const;

export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 7)}…${trimmed.slice(-4)}`;
}

export async function validateOpenAiApiKey(apiKey: string): Promise<void> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      text.includes('invalid_api_key') || response.status === 401
        ? 'Invalid OpenAI API key.'
        : `OpenAI validation failed (${response.status}).`
    );
  }
}

export async function getUserAiCredential(
  prisma: PrismaClient,
  userId: string
): Promise<{ apiKey: string; model: string } | null> {
  const row = await prisma.userAiCredential.findUnique({ where: { userId } });
  if (!row) return null;
  try {
    return {
      apiKey: decrypt(row.encryptedApiKey),
      model: row.model,
    };
  } catch {
    return null;
  }
}

export async function getUserAiCredentialPublic(
  prisma: PrismaClient,
  userId: string
): Promise<{
  configured: boolean;
  provider: string;
  model: string;
  maskedKey: string | null;
}> {
  const row = await prisma.userAiCredential.findUnique({ where: { userId } });
  if (!row) {
    return {
      configured: false,
      provider: 'openai',
      model: 'gpt-4o-mini',
      maskedKey: null,
    };
  }
  let maskedKey: string | null = null;
  try {
    maskedKey = maskApiKey(decrypt(row.encryptedApiKey));
  } catch {
    maskedKey = '••••••••';
  }
  return {
    configured: true,
    provider: row.provider,
    model: row.model,
    maskedKey,
  };
}

export async function upsertUserAiCredential(
  prisma: PrismaClient,
  userId: string,
  apiKey: string | undefined,
  model: string
): Promise<void> {
  const existing = await prisma.userAiCredential.findUnique({ where: { userId } });
  const trimmedKey = apiKey?.trim();

  if (!trimmedKey && !existing) {
    throw new Error('API key is required.');
  }

  if (trimmedKey) {
    await validateOpenAiApiKey(trimmedKey);
    const encryptedApiKey = encrypt(trimmedKey);
    await prisma.userAiCredential.upsert({
      where: { userId },
      create: {
        userId,
        provider: 'openai',
        encryptedApiKey,
        model,
      },
      update: {
        encryptedApiKey,
        model,
      },
    });
    return;
  }

  await prisma.userAiCredential.update({
    where: { userId },
    data: { model },
  });
}

export async function deleteUserAiCredential(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  await prisma.userAiCredential.deleteMany({ where: { userId } });
}
