import type { SocialPlatform } from '@nibras/contracts';

const MAX_VALUE_LENGTH = 512;

const PLATFORMS: SocialPlatform[] = [
  'website',
  'linkedin',
  'x',
  'instagram',
  'youtube',
  'discord',
];

export type SocialLinkInput = {
  platform: SocialPlatform;
  value: string;
};

export type NormalizedSocialLink = {
  platform: SocialPlatform;
  value: string;
  url: string;
};

function isSocialPlatform(value: string): value is SocialPlatform {
  return (PLATFORMS as string[]).includes(value);
}

function ensureHttpsUrl(raw: string, allowedHosts?: string[]): string {
  let candidate = raw.trim();
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('URL must use http or https.');
  }
  if (allowedHosts && !allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
    throw new Error(`URL must be on ${allowedHosts.join(' or ')}.`);
  }
  const normalized = parsed.toString();
  if (normalized.length > MAX_VALUE_LENGTH) {
    throw new Error('URL is too long.');
  }
  return normalized;
}

function normalizeX(value: string): NormalizedSocialLink {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('X handle cannot be empty.');
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('x.com') || trimmed.includes('twitter.com')) {
    const url = ensureHttpsUrl(trimmed);
    const parsed = new URL(url);
    if (!['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com'].some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
      throw new Error('X URL must be on x.com or twitter.com.');
    }
    return { platform: 'x', value: url, url };
  }
  const handle = trimmed.replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    throw new Error('Invalid X handle.');
  }
  const url = `https://x.com/${handle}`;
  return { platform: 'x', value: handle, url };
}

function normalizeDiscord(value: string): NormalizedSocialLink {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Discord value cannot be empty.');
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('discord.')) {
    const url = ensureHttpsUrl(trimmed, ['discord.com', 'discord.gg']);
    return { platform: 'discord', value: url, url };
  }
  if (trimmed.length > 80) {
    throw new Error('Discord username is too long.');
  }
  return { platform: 'discord', value: trimmed, url: trimmed };
}

function normalizeUrlPlatform(
  platform: 'website' | 'linkedin' | 'instagram' | 'youtube',
  value: string,
  allowedHosts?: string[]
): NormalizedSocialLink {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${platform} URL cannot be empty.`);
  }
  const url = ensureHttpsUrl(trimmed, allowedHosts);
  return { platform, value: url, url };
}

export function normalizeSocialLink(input: SocialLinkInput): NormalizedSocialLink {
  if (!isSocialPlatform(input.platform)) {
    throw new Error('Invalid social platform.');
  }
  switch (input.platform) {
    case 'website':
      return normalizeUrlPlatform('website', input.value);
    case 'linkedin':
      return normalizeUrlPlatform('linkedin', input.value, [
        'linkedin.com',
        'www.linkedin.com',
      ]);
    case 'instagram':
      return normalizeUrlPlatform('instagram', input.value, [
        'instagram.com',
        'www.instagram.com',
      ]);
    case 'youtube':
      return normalizeUrlPlatform('youtube', input.value, [
        'youtube.com',
        'www.youtube.com',
        'youtu.be',
      ]);
    case 'x':
      return normalizeX(input.value);
    case 'discord':
      return normalizeDiscord(input.value);
    default:
      throw new Error('Unsupported platform.');
  }
}

export function normalizeSocialLinks(
  inputs: SocialLinkInput[] | undefined
): NormalizedSocialLink[] {
  if (!inputs || inputs.length === 0) {
    return [];
  }
  const seen = new Set<SocialPlatform>();
  const result: NormalizedSocialLink[] = [];
  for (const input of inputs) {
    const trimmed = input.value?.trim() ?? '';
    if (!trimmed) continue;
    const normalized = normalizeSocialLink({ platform: input.platform, value: trimmed });
    if (seen.has(normalized.platform)) continue;
    seen.add(normalized.platform);
    result.push(normalized);
  }
  return result;
}

export function socialLinkDisplayUrl(link: { platform: SocialPlatform; value: string }): string {
  if (link.platform === 'x' && !/^https?:\/\//i.test(link.value)) {
    return `https://x.com/${link.value.replace(/^@/, '')}`;
  }
  if (
    link.platform === 'website' ||
    link.platform === 'linkedin' ||
    link.platform === 'instagram' ||
    link.platform === 'youtube' ||
    (link.platform === 'discord' && /^https?:\/\//i.test(link.value))
  ) {
    return link.value.startsWith('http') ? link.value : `https://${link.value}`;
  }
  if (link.platform === 'x' && /^https?:\/\//i.test(link.value)) {
    return link.value;
  }
  if (link.platform === 'discord' && !/^https?:\/\//i.test(link.value)) {
    return 'https://discord.com';
  }
  return link.value.startsWith('http') ? link.value : `https://${link.value}`;
}
