import { PrismaClient } from '@prisma/client';
import { forkRepository, generateRepositoryFromTemplate, type GitHubAppConfig } from '@nibras/github';
import type { AppStore } from '../../../store';

function sanitizeRepoName(login: string): string {
  const base = `nibras-75-${login}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return base.slice(0, 100) || 'nibras-75-workspace';
}

export async function getNibras75Workspace(prisma: PrismaClient, userId: string) {
  return prisma.nibras75Workspace.findUnique({ where: { userId } });
}

export async function forkNibras75Workspace(
  prisma: PrismaClient,
  store: AppStore,
  githubConfig: GitHubAppConfig | null,
  userId: string
) {
  if (!githubConfig) {
    throw new Error('GitHub App is not configured on this server.');
  }

  const existing = await prisma.nibras75Workspace.findUnique({ where: { userId } });
  if (existing) return existing;

  const account = await store.getGithubAccountForUser(userId);
  if (!account?.userAccessToken) {
    throw new Error('Link your GitHub account before forking the Nibras 75 workspace.');
  }

  const templateOwner = process.env.NIBRAS_75_TEMPLATE_OWNER?.trim() || 'NibrasPlatform';
  const templateRepo = process.env.NIBRAS_75_TEMPLATE_REPO?.trim() || 'nibras-75';
  const repoName = sanitizeRepoName(account.login);

  let generated: { cloneUrl: string | null; htmlUrl: string | null; fullName: string };
  try {
    generated = await forkRepository(
      githubConfig,
      account.userAccessToken,
      templateOwner,
      templateRepo,
      repoName
    );
  } catch {
    generated = await generateRepositoryFromTemplate(
      githubConfig,
      account.userAccessToken,
      account.login,
      repoName
    );
  }

  const [owner, name] = generated.fullName.includes('/')
    ? generated.fullName.split('/', 2)
    : [account.login, repoName];

  return prisma.nibras75Workspace.create({
    data: {
      userId,
      owner,
      repoName: name,
      fullName: generated.fullName,
      htmlUrl: generated.htmlUrl ?? `https://github.com/${generated.fullName}`,
      cloneUrl: generated.cloneUrl,
    },
  });
}
