/** Server-side auth provider availability. Used by /api/auth/providers-config. */
export function getAuthProvidersConfig(): {
  github: boolean;
  magicLink: boolean;
} {
  const github = Boolean(process.env.GITHUB_APP_CLIENT_ID && process.env.GITHUB_APP_CLIENT_SECRET);
  const magicLink = Boolean(process.env.RESEND_API_KEY);
  return {
    github,
    magicLink,
  };
}
