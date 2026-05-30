import { MeResponseSchema, type MeResponse } from '@nibras/contracts';
import { CourseRole, SystemRole, type PrismaClient } from '@prisma/client';

type SessionUser = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  githubLinked: boolean;
  githubAppInstalled: boolean;
  systemRole: SystemRole;
  yearLevel: number;
  githubAccount: { login: string } | null;
};

type SessionMembership = {
  courseId: string;
  role: CourseRole;
  level: number;
};

function normalizeDisplayName(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveGithubLogin(user: {
  username: string;
  githubAccount: { login: string } | null;
}): string {
  const login = user.githubAccount?.login?.trim();
  return login && login.length > 0 ? login : user.username;
}

export function buildMeResponseFromSession(
  user: SessionUser,
  memberships: SessionMembership[],
  apiBaseUrl: string
): MeResponse {
  return MeResponseSchema.parse({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: normalizeDisplayName(user.displayName),
      githubLogin: resolveGithubLogin(user),
      githubLinked: user.githubLinked,
      githubAppInstalled: user.githubAppInstalled,
      systemRole: user.systemRole === SystemRole.admin ? 'admin' : 'user',
      yearLevel: user.yearLevel ?? 1,
    },
    apiBaseUrl,
    memberships: memberships.map((entry) => ({
      courseId: entry.courseId,
      role: entry.role,
      level: entry.level,
    })),
  });
}

type WebSessionLookup = {
  sessionToken: string;
  expiresAt: Date;
  revokedAt: Date | null;
  userId: string;
  user: SessionUser;
};

export type ResolveWebSessionDeps = {
  prisma: Pick<PrismaClient, 'webSession' | 'courseMembership'>;
  sessionToken: string;
  apiBaseUrl: string;
};

export async function resolveWebSessionMeResponseWith(
  deps: ResolveWebSessionDeps
): Promise<MeResponse | null> {
  const session = (await deps.prisma.webSession.findUnique({
    where: { sessionToken: deps.sessionToken },
    include: {
      user: { include: { githubAccount: true } },
    },
  })) as WebSessionLookup | null;

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const memberships = await deps.prisma.courseMembership.findMany({
    where: { userId: session.userId },
  });

  return buildMeResponseFromSession(session.user, memberships, deps.apiBaseUrl);
}

export async function resolveWebSessionMeResponse(
  sessionToken: string,
  apiBaseUrl: string
): Promise<MeResponse | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  const { prisma } = await import('./prisma');
  return resolveWebSessionMeResponseWith({ prisma, sessionToken, apiBaseUrl });
}

export function resolvePublicApiBaseUrl(webOrigin: string): string {
  const configured =
    process.env.NEXT_PUBLIC_NIBRAS_API_BASE_URL ?? process.env.NIBRAS_API_BASE_URL ?? webOrigin;
  return configured.replace(/\/$/, '');
}
