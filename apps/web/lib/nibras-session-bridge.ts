import { randomUUID } from 'node:crypto';
import { CourseRole } from '@prisma/client';
import { encrypt as encryptValue } from '@nibras/core';
import { allocateUniqueUsername, deriveUsernameBase } from './auth-user-helpers';
import { prisma } from './prisma';

function maybeEncrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!process.env.NIBRAS_ENCRYPTION_KEY) return value;
  try {
    return encryptValue(value);
  } catch {
    return value;
  }
}

async function autoEnrollDemoCourses(userId: string): Promise<void> {
  await Promise.all(
    ['cs161', 'cs106l'].map(async (slug) => {
      try {
        const course = await prisma.course.findUnique({ where: { slug } });
        if (!course) return;
        await prisma.courseMembership.upsert({
          where: { courseId_userId: { courseId: course.id, userId } },
          update: {},
          create: { courseId: course.id, userId, role: CourseRole.student },
        });
      } catch {
        /* non-fatal */
      }
    })
  );
}

type GithubLinkInput = {
  userId: string;
  githubUserId: string;
  login: string;
  userAccessToken: string | null;
  userRefreshToken: string | null;
  userAccessTokenExpiresAt: Date | null;
  userRefreshTokenExpiresAt: Date | null;
};

/** Returns the Nibras user id that should own the web session (may differ from Better Auth user). */
async function syncGithubAccount(input: GithubLinkInput): Promise<string> {
  const tokenData = {
    login: input.login,
    userAccessToken: maybeEncrypt(input.userAccessToken),
    userRefreshToken: maybeEncrypt(input.userRefreshToken),
    userAccessTokenExpiresAt: input.userAccessTokenExpiresAt,
    userRefreshTokenExpiresAt: input.userRefreshTokenExpiresAt,
  };

  const existingByGithubId = await prisma.githubAccount.findUnique({
    where: { githubUserId: input.githubUserId },
  });
  if (existingByGithubId) {
    await prisma.githubAccount.update({
      where: { githubUserId: input.githubUserId },
      data: tokenData,
    });
    return existingByGithubId.userId;
  }

  const existingByUserId = await prisma.githubAccount.findUnique({
    where: { userId: input.userId },
  });
  if (existingByUserId) {
    await prisma.githubAccount.update({
      where: { userId: input.userId },
      data: {
        githubUserId: input.githubUserId,
        ...tokenData,
      },
    });
    return input.userId;
  }

  await prisma.githubAccount.create({
    data: {
      userId: input.userId,
      githubUserId: input.githubUserId,
      ...tokenData,
    },
  });
  return input.userId;
}

/**
 * Ensures Nibras profile + GitHub link for a Better Auth user.
 * @returns User id to use for WebSession (existing GitHub-linked user wins on conflict).
 */
export async function ensureNibrasUserProfile(authUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: authUserId } });
  if (!user) {
    throw new Error('User not found for session bridge.');
  }

  let effectiveUserId = authUserId;

  let username = user.username;
  if (!username || username.length < 2) {
    username = await allocateUniqueUsername(deriveUsernameBase(user.displayName, user.email));
    await prisma.user.update({
      where: { id: authUserId },
      data: { username },
    });
  }

  const accounts = await prisma.authAccount.findMany({ where: { userId: authUserId } });
  const github = accounts.find((a) => a.providerId === 'github');
  if (github) {
    let login = user.displayName ?? user.username;
    let githubUserId = github.accountId;
    if (github.accessToken) {
      try {
        const ghRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${github.accessToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'nibras-web',
          },
        });
        if (ghRes.ok) {
          const ghUser = (await ghRes.json()) as { id: number; login: string };
          login = ghUser.login;
          githubUserId = String(ghUser.id);
        }
      } catch {
        /* use fallbacks */
      }
    }

    effectiveUserId = await syncGithubAccount({
      userId: authUserId,
      githubUserId,
      login,
      userAccessToken: github.accessToken,
      userRefreshToken: github.refreshToken,
      userAccessTokenExpiresAt: github.accessTokenExpiresAt,
      userRefreshTokenExpiresAt: github.refreshTokenExpiresAt,
    });

    await prisma.user.update({
      where: { id: effectiveUserId },
      data: {
        githubLinked: true,
        displayName: user.displayName?.trim() || login,
      },
    });
  } else if (!user.displayName?.trim()) {
    const displayName =
      username || deriveUsernameBase(null, user.email) || user.email.split('@')[0] || 'User';
    await prisma.user.update({
      where: { id: authUserId },
      data: { displayName },
    });
  }

  await autoEnrollDemoCourses(effectiveUserId);
  return effectiveUserId;
}

export async function createNibrasWebSession(userId: string): Promise<string> {
  const created = await prisma.webSession.create({
    data: {
      userId,
      sessionToken: `web_${randomUUID()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return created.sessionToken;
}
