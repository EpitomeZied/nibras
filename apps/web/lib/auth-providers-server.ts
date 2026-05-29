export type AuthProvidersConfig = {
  github: boolean;
  magicLink: boolean;
};

/** Server-side auth provider availability. Used by /api/auth/providers-config. */
export function getAuthProvidersConfig(): AuthProvidersConfig {
  const github = Boolean(process.env.GITHUB_APP_CLIENT_ID && process.env.GITHUB_APP_CLIENT_SECRET);
  const magicLink = Boolean(process.env.RESEND_API_KEY);
  return {
    github,
    magicLink,
  };
}

export function hasAnyAuthProvider(config: AuthProvidersConfig): boolean {
  return config.github || config.magicLink;
}

/** Message when no sign-in providers are configured (web UI empty state). */
export function getUnavailableSignInMessage(
  isProduction = process.env.NODE_ENV === 'production'
): string {
  if (isProduction) {
    return 'Sign-in is not available on this server yet. Contact your administrator.';
  }
  return 'Sign-in is not configured. Set GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET, and/or RESEND_API_KEY in your environment.';
}
