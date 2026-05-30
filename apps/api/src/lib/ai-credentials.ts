import { assertEncryptionKeyConfigured, encrypt, decrypt, getEncryptionKeyStatus } from '@nibras/core';
import type { PrismaClient } from '@prisma/client';

export type AiProviderId = 'openai' | 'groq' | 'openrouter';

export type AiProviderPreset = {
  id: AiProviderId;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: readonly string[];
  validateUrl: string;
};

export const AI_PROVIDER_PRESETS: Record<AiProviderId, AiProviderPreset> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
    validateUrl: 'https://api.openai.com/v1/models',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    models: [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'meta-llama/llama-4-scout-17b-16e-instruct',
    ],
    validateUrl: 'https://api.groq.com/openai/v1/models',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.2-3b-instruct:free',
    models: [
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2.5-7b-instruct:free',
    ],
    validateUrl: 'https://openrouter.ai/api/v1/models',
  },
};

export const OPENAI_MODEL_OPTIONS = AI_PROVIDER_PRESETS.openai.models;

export function encryptionKeyErrorMessage(): string | null {
  const status = getEncryptionKeyStatus();
  if (status === 'ok') return null;
  if (status === 'missing') {
    return 'Server encryption is not configured (NIBRAS_ENCRYPTION_KEY). Personal API keys cannot be saved yet.';
  }
  return 'Server encryption key is invalid. Contact support before saving a personal API key.';
}

export function hasPlatformAiKey(): boolean {
  return Boolean(
    (process.env.NIBRAS_AI_API_KEY || process.env.OPENAI_API_KEY || '').trim()
  );
}

export const HASSONA_CREDENTIAL_REQUIRED_MESSAGE =
  'Connect an API key in Settings → AI Integration to use Hassona. Use OpenAI, Groq (free tier), or OpenRouter.';

export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 7)}…${trimmed.slice(-4)}`;
}

export function resolveProviderPreset(provider: string): AiProviderPreset {
  const id = provider as AiProviderId;
  return AI_PROVIDER_PRESETS[id] ?? AI_PROVIDER_PRESETS.openai;
}

function providerValidationHeaders(provider: AiProviderId, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey.trim()}`,
  };
  if (provider === 'openrouter') {
    const site =
      process.env.NIBRAS_WEB_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL?.trim() ||
      'http://127.0.0.1:3000';
    headers['HTTP-Referer'] = site.replace(/\/$/, '');
    headers['X-OpenRouter-Title'] = 'Nibras Hassona';
  }
  return headers;
}

async function validateWithChatProbe(provider: AiProviderId, apiKey: string): Promise<void> {
  const preset = AI_PROVIDER_PRESETS[provider];
  const response = await fetch(`${preset.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      ...providerValidationHeaders(provider, apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: preset.defaultModel,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Invalid ${preset.name} API key.`);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      text.includes('invalid') || text.includes('Unauthorized')
        ? `Invalid ${preset.name} API key.`
        : `${preset.name} validation failed (${response.status}). Check the model name and try again.`
    );
  }
}

export async function validateProviderApiKey(
  provider: AiProviderId,
  apiKey: string
): Promise<void> {
  if (process.env.NIBRAS_SKIP_AI_KEY_VALIDATION === 'true') {
    return;
  }

  const preset = AI_PROVIDER_PRESETS[provider];
  const headers = providerValidationHeaders(provider, apiKey);

  try {
    const response = await fetch(preset.validateUrl, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) {
      return;
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Invalid ${preset.name} API key.`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid')) {
      throw err;
    }
    // Network or non-auth failure — fall through to chat probe
  }

  await validateWithChatProbe(provider, apiKey);
}

/** @deprecated Use validateProviderApiKey */
export async function validateOpenAiApiKey(apiKey: string): Promise<void> {
  await validateProviderApiKey('openai', apiKey);
}

export type UserAiCredentialRecord = {
  apiKey: string;
  model: string;
  provider: string;
  baseUrl: string;
};

export async function getUserAiCredential(
  prisma: PrismaClient,
  userId: string
): Promise<UserAiCredentialRecord | null> {
  const row = await prisma.userAiCredential.findUnique({ where: { userId } });
  if (!row) return null;
  try {
    const preset = resolveProviderPreset(row.provider);
    return {
      apiKey: decrypt(row.encryptedApiKey),
      model: row.model,
      provider: row.provider,
      baseUrl: row.baseUrl?.trim() || preset.baseUrl,
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
  tutorAvailable: boolean;
  provider: string;
  model: string;
  baseUrl: string | null;
  maskedKey: string | null;
  encryptionReady: boolean;
}> {
  const encryptionReady = getEncryptionKeyStatus() === 'ok';
  const platformTutor = hasPlatformAiKey();
  const row = await prisma.userAiCredential.findUnique({ where: { userId } });
  if (!row) {
    return {
      configured: false,
      tutorAvailable: platformTutor,
      provider: 'openai',
      model: AI_PROVIDER_PRESETS.openai.defaultModel,
      baseUrl: null,
      maskedKey: null,
      encryptionReady,
    };
  }
  let maskedKey: string | null = null;
  try {
    maskedKey = maskApiKey(decrypt(row.encryptedApiKey));
  } catch {
    maskedKey = '••••••••';
  }
  const preset = resolveProviderPreset(row.provider);
  return {
    configured: true,
    tutorAvailable: true,
    provider: row.provider,
    model: row.model,
    baseUrl: row.baseUrl?.trim() || preset.baseUrl,
    maskedKey,
    encryptionReady,
  };
}

export async function upsertUserAiCredential(
  prisma: PrismaClient,
  userId: string,
  apiKey: string | undefined,
  provider: AiProviderId,
  model: string
): Promise<void> {
  const existing = await prisma.userAiCredential.findUnique({ where: { userId } });
  const trimmedKey = apiKey?.trim();
  const preset = AI_PROVIDER_PRESETS[provider] ?? AI_PROVIDER_PRESETS.openai;
  const resolvedModel = model.trim() || preset.defaultModel;
  const baseUrl = preset.baseUrl;

  if (!trimmedKey && !existing) {
    throw new Error('API key is required.');
  }

  if (trimmedKey) {
    assertEncryptionKeyConfigured();
    await validateProviderApiKey(provider, trimmedKey);
    const encryptedApiKey = encrypt(trimmedKey);
    await prisma.userAiCredential.upsert({
      where: { userId },
      create: {
        userId,
        provider,
        baseUrl,
        encryptedApiKey,
        model: resolvedModel,
      },
      update: {
        provider,
        baseUrl,
        encryptedApiKey,
        model: resolvedModel,
      },
    });
    return;
  }

  await prisma.userAiCredential.update({
    where: { userId },
    data: { provider, baseUrl, model: resolvedModel },
  });
}

export async function deleteUserAiCredential(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  await prisma.userAiCredential.deleteMany({ where: { userId } });
}

export function tutorPayloadFromCredential(
  credential: UserAiCredentialRecord,
  body: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...body,
    api_key: credential.apiKey,
    model: credential.model,
    base_url: credential.baseUrl,
    provider: credential.provider,
  };
}
