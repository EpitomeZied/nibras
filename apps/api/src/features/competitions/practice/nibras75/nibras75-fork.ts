import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  createPrivateRepository,
  forkRepository,
  formatGitHubApiErrorMessage,
  generateRepositoryFromTemplate,
  getGitHubRepository,
  GITHUB_REPO_PROVISION_PERMISSION_MESSAGE,
  GitHubRequestError,
  isGitHubIntegrationAccessDenied,
  type GitHubAppConfig,
} from '@nibras/github';
import type { AppStore } from '../../../../store';

type RepoSnapshot = {
  cloneUrl: string | null;
  htmlUrl: string | null;
  fullName: string;
};

function sanitizeRepoName(login: string): string {
  const base = `nibras-75-${login}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return base.slice(0, 100) || 'nibras-75-workspace';
}

function repoAlreadyExists(err: unknown): boolean {
  if (!(err instanceof GitHubRequestError)) return false;
  if (err.statusCode !== 422) return false;
  const text = err.bodyText.toLowerCase();
  return text.includes('already exists') || text.includes('name already exists');
}

function failuresIncludeIntegrationAccessDenied(failures: string[]): boolean {
  return failures.some((message) =>
    message.toLowerCase().includes('resource not accessible by integration')
  );
}

async function loadExistingUserRepo(
  githubConfig: GitHubAppConfig,
  userToken: string,
  owner: string,
  repoName: string
): Promise<RepoSnapshot | null> {
  try {
    const repo = await getGitHubRepository(githubConfig, userToken, owner, repoName);
    return {
      cloneUrl: `https://github.com/${repo.fullName}.git`,
      htmlUrl: repo.repoUrl,
      fullName: repo.fullName,
    };
  } catch {
    return null;
  }
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

  const account = await store.ensureFreshGithubUserToken(userId, githubConfig);
  if (!account?.userAccessToken) {
    throw new Error('Link your GitHub account before forking the Nibras 75 workspace.');
  }

  const templateOwner = process.env.NIBRAS_75_TEMPLATE_OWNER?.trim() || 'EpitomeZied';
  const templateRepo = process.env.NIBRAS_75_TEMPLATE_REPO?.trim() || 'nibras-75';
  const repoName = sanitizeRepoName(account.login);
  const templateConfig: GitHubAppConfig = {
    ...githubConfig,
    templateOwner,
    templateRepo,
  };

  const failures: string[] = [];
  let generated: RepoSnapshot | null = null;
  let integrationAccessDenied = false;

  // Template repos must be created via /generate (fork API fails on template sources).
  try {
    generated = await generateRepositoryFromTemplate(
      templateConfig,
      account.userAccessToken,
      account.login,
      repoName
    );
  } catch (err) {
    integrationAccessDenied ||= isGitHubIntegrationAccessDenied(err);
    failures.push(formatGitHubApiErrorMessage(err, 'Template'));
    if (repoAlreadyExists(err)) {
      generated = await loadExistingUserRepo(
        githubConfig,
        account.userAccessToken,
        account.login,
        repoName
      );
    }
  }

  if (!generated) {
    try {
      generated = await forkRepository(
        githubConfig,
        account.userAccessToken,
        templateOwner,
        templateRepo,
        repoName
      );
    } catch (err) {
      integrationAccessDenied ||= isGitHubIntegrationAccessDenied(err);
      failures.push(formatGitHubApiErrorMessage(err, 'Fork'));
      if (repoAlreadyExists(err)) {
        generated = await loadExistingUserRepo(
          githubConfig,
          account.userAccessToken,
          account.login,
          repoName
        );
      }
    }
  }

  if (!generated) {
    const reused = await loadExistingUserRepo(
      githubConfig,
      account.userAccessToken,
      account.login,
      repoName
    );
    if (reused) {
      generated = reused;
    }
  }

  // When the template repo is missing or not marked as a template, still provision a workspace.
  if (!generated) {
    try {
      generated = await createPrivateRepository(
        githubConfig,
        account.userAccessToken,
        account.login,
        repoName
      );
    } catch (err) {
      integrationAccessDenied ||= isGitHubIntegrationAccessDenied(err);
      failures.push(formatGitHubApiErrorMessage(err, 'Create'));
      if (repoAlreadyExists(err)) {
        generated = await loadExistingUserRepo(
          githubConfig,
          account.userAccessToken,
          account.login,
          repoName
        );
      }
    }
  }

  if (!generated) {
    if (
      integrationAccessDenied ||
      failuresIncludeIntegrationAccessDenied(failures)
    ) {
      throw new Error(GITHUB_REPO_PROVISION_PERMISSION_MESSAGE);
    }
    throw new Error(
      failures.length > 0
        ? `Could not create your Nibras 75 repo. ${failures.join(' ')}`
        : 'Could not create your Nibras 75 repo. Check NIBRAS_75_TEMPLATE_OWNER and NIBRAS_75_TEMPLATE_REPO.'
    );
  }

  const [owner, name] = generated.fullName.includes('/')
    ? generated.fullName.split('/', 2)
    : [account.login, repoName];

  try {
    return await prisma.nibras75Workspace.create({
      data: {
        userId,
        owner,
        repoName: name,
        fullName: generated.fullName,
        htmlUrl: generated.htmlUrl ?? `https://github.com/${generated.fullName}`,
        cloneUrl: generated.cloneUrl,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const raced = await prisma.nibras75Workspace.findUnique({ where: { userId } });
      if (raced) return raced;
    }
    throw err;
  }
}
