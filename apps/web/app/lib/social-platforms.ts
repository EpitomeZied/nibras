import type { SocialPlatform } from '@nibras/contracts';

export const SOCIAL_PLATFORM_CONFIG: Array<{
  platform: SocialPlatform;
  label: string;
  placeholder: string;
}> = [
  { platform: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
  { platform: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you' },
  { platform: 'x', label: 'X (Twitter)', placeholder: '@handle or profile URL' },
  { platform: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/you' },
  { platform: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@you' },
  { platform: 'discord', label: 'Discord', placeholder: 'username or invite link' },
];

export function emptySocialLinkState(): Record<SocialPlatform, string> {
  return {
    website: '',
    linkedin: '',
    x: '',
    instagram: '',
    youtube: '',
    discord: '',
  };
}

export function socialLinksFromProfile(
  links: Array<{ platform: SocialPlatform; value: string }>
): Record<SocialPlatform, string> {
  const state = emptySocialLinkState();
  for (const link of links) {
    state[link.platform] = link.value;
  }
  return state;
}

export function socialLinksToPayload(
  state: Record<SocialPlatform, string>
): Array<{ platform: SocialPlatform; value: string }> {
  return SOCIAL_PLATFORM_CONFIG.map(({ platform }) => ({
    platform,
    value: state[platform].trim(),
  })).filter((entry) => entry.value.length > 0);
}
