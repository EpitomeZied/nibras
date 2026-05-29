type GitHubToken = {
  accessToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
};

type GitHubUserProfile = {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type GitHubEmailEntry = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: string | null;
};

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Nibras',
};

export async function resolveGitHubUserEmail(
  accessToken: string,
  profile: GitHubUserProfile
): Promise<string> {
  if (profile.email) {
    return profile.email;
  }

  const emailsRes = await fetch('https://api.github.com/user/emails', {
    headers: {
      ...GITHUB_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (emailsRes.ok) {
    const emails = (await emailsRes.json()) as GitHubEmailEntry[];
    const primaryVerified = emails.find((e) => e.primary && e.verified);
    const anyVerified = emails.find((e) => e.verified);
    const pick = primaryVerified ?? anyVerified ?? emails[0];
    if (pick?.email) {
      return pick.email;
    }
  }

  // GitHub noreply address (unique per user) when email is private or unavailable.
  return `${profile.id}+${profile.login}@users.noreply.github.com`;
}

/** Better Auth `getUserInfo` for GitHub — handles private / missing primary email. */
export async function githubOAuthGetUserInfo(token: GitHubToken) {
  const accessToken = token.accessToken;
  if (!accessToken) {
    throw new Error('GitHub sign-in did not return an access token.');
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      ...GITHUB_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userRes.ok) {
    throw new Error(`GitHub user request failed (${userRes.status}).`);
  }

  const profile = (await userRes.json()) as GitHubUserProfile;
  const email = await resolveGitHubUserEmail(accessToken, profile);

  return {
    user: {
      id: String(profile.id),
      name: profile.name ?? profile.login,
      email,
      image: profile.avatar_url ?? undefined,
      emailVerified: true,
    },
    data: profile,
  };
}
