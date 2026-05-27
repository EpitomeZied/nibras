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

export async function ensureNibrasUserProfile(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found for session bridge.');
  }

  if (!user.username || user.username.length < 2) {
    const username = await allocateUniqueUsername(deriveUsernameBase(user.displayName, user.email));
    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });
  }

  const accounts = await prisma.authAccount.findMany({ where: { userId } });
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
    await prisma.user.update({
      where: { id: userId },
      data: {
        githubLinked: true,
        displayName: user.displayName ?? login,
      },
    });

    await prisma.githubAccount.upsert({
      where: { userId },
      update: {
        githubUserId,
        login,
        userAccessToken: maybeEncrypt(github.accessToken),
        userRefreshToken: maybeEncrypt(github.refreshToken),
        userAccessTokenExpiresAt: github.accessTokenExpiresAt,
        userRefreshTokenExpiresAt: github.refreshTokenExpiresAt,
      },
      create: {
        userId,
        githubUserId,
        login,
        userAccessToken: maybeEncrypt(github.accessToken),
        userRefreshToken: maybeEncrypt(github.refreshToken),
        userAccessTokenExpiresAt: github.accessTokenExpiresAt,
        userRefreshTokenExpiresAt: github.refreshTokenExpiresAt,
      },
    });
  }

  await autoEnrollDemoCourses(userId);
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
