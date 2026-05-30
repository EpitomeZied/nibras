/**
 * Open Curricula Projects Seed — milestones for MIT Missing Semester labs.
 */
import { DeliveryMode, type PrismaClient, ProjectStatus } from '@prisma/client';

export const OPEN_CURRICULA_RELEASE = '2026-05-30-missing-semester-v1';

const ATTRIBUTION = `
Official materials: https://missing.csail.mit.edu/ (CC BY-NC-SA).
`;

type ProjectDef = {
  key: string;
  name: string;
  description: string;
  task: string;
  milestone: string;
  dueAt: string;
  submissionHint: 'text' | 'link';
};

const PROJECTS: Record<string, ProjectDef[]> = {
  'missing-semester': [
    {
      key: 'missing-semester/shell-workflow',
      name: 'Shell Workflow Lab',
      description: 'Demonstrate a repeatable shell workflow with transcripts and reflection.',
      submissionHint: 'text',
      dueAt: '2026-06-15T23:59:59Z',
      milestone: 'Submit a command transcript and short reflection on shell fluency.',
      task: `# Project: Shell Workflow Lab

Complete the shell exercises from Lecture 1, then submit your deliverable.

## Submit via Nibras
- **Submission type:** Text
- Paste your command transcript and 3–5 sentence reflection

## Include
1. Navigation exercise output (\`missing-a1\` tree)
2. Word-frequency pipeline one-liner and sample output
3. One challenge you hit and how you solved it
${ATTRIBUTION}`,
    },
    {
      key: 'missing-semester/terminal-environment',
      name: 'Terminal Environment Setup',
      description: 'Prove tmux and dotfiles are configured for daily use.',
      submissionHint: 'link',
      dueAt: '2026-06-29T23:59:59Z',
      milestone: 'Link to dotfiles repo or gist plus tmux session notes.',
      task: `# Project: Terminal Environment Setup

## Submit via Nibras
- **Submission type:** Link
- URL to your dotfiles repository (or public gist with configs)

## Include in README (or submission notes)
1. tmux session name and attach command you use
2. One alias or plugin you rely on
3. How to bootstrap a new machine from your dotfiles
${ATTRIBUTION}`,
    },
    {
      key: 'missing-semester/dev-environment',
      name: 'Dev Environment Checklist',
      description: 'Document a complete development environment audit.',
      submissionHint: 'text',
      dueAt: '2026-07-13T23:59:59Z',
      milestone: 'Submit environment checklist and editor proficiency evidence.',
      task: `# Project: Dev Environment Checklist

## Submit via Nibras
- **Submission type:** Text
- Paste your checklist (markdown ok)

## Checklist sections
- Editor + keybindings/plugins
- Shell + history configuration
- Language runtimes and version managers
- One improvement made this week
${ATTRIBUTION}`,
    },
    {
      key: 'missing-semester/debugging-lab',
      name: 'Debugging Lab',
      description: 'Fix a bug using a debugger and write a post-mortem.',
      submissionHint: 'text',
      dueAt: '2026-07-27T23:59:59Z',
      milestone: 'Submit post-mortem and description of debugger steps.',
      task: `# Project: Debugging Lab

## Submit via Nibras
- **Submission type:** Text

## Include
1. Reproduction steps
2. Debugger commands you used (breakpoint, step, inspect)
3. Root cause and fix (code snippet or diff in fenced block)
4. Prevention idea
${ATTRIBUTION}`,
    },
    {
      key: 'missing-semester/git-history',
      name: 'Git History Exercise',
      description: 'Demonstrate branching, merging, and reading git history.',
      submissionHint: 'link',
      dueAt: '2026-08-10T23:59:59Z',
      milestone: 'Link to a public repository showing branch graph and merge.',
      task: `# Project: Git History Exercise

## Submit via Nibras
- **Submission type:** Link
- Public Git repository URL

## Repository must show
1. Feature branch with at least 2 commits merged to main
2. \`git log --oneline --graph\` output in README or PR description
3. Brief note on merge vs rebase preference
${ATTRIBUTION}`,
    },
    {
      key: 'missing-semester/packaging-lab',
      name: 'Packaging Lab',
      description: 'Package a small tool for distribution.',
      submissionHint: 'link',
      dueAt: '2026-08-24T23:59:59Z',
      milestone: 'Link to repo or release with install instructions.',
      task: `# Project: Packaging Lab

## Submit via Nibras
- **Submission type:** Link
- Repository or release page with install docs

## Include
1. \`pyproject.toml\`, \`package.json\`, or Makefile
2. Version and how to install
3. How to run tests
${ATTRIBUTION}`,
    },
    {
      key: 'missing-semester/agentic-workflow',
      name: 'Agentic Workflow Doc',
      description: 'Reflect on responsible AI-assisted coding.',
      submissionHint: 'text',
      dueAt: '2026-09-07T23:59:59Z',
      milestone: 'Submit process log and critical reflection on AI tool use.',
      task: `# Project: Agentic Workflow Doc

## Submit via Nibras
- **Submission type:** Text

## Include
1. Task description (high level, no secrets)
2. Prompt log (initial + one revision)
3. Verification steps you ran manually
4. Reflection: failures, limits, personal rule going forward
${ATTRIBUTION}`,
    },
    {
      key: 'missing-semester/documentation',
      name: 'Documentation Deliverable',
      description: 'Improve README and write a PR or incident summary.',
      submissionHint: 'link',
      dueAt: '2026-09-21T23:59:59Z',
      milestone: 'Link to repo/docs or submit text PR description.',
      task: `# Project: Documentation Deliverable

## Submit via Nibras
- **Submission type:** Link **or** Text
- Link: repo with improved README
- Text: paste PR description + README sections if repo is private

## Include
1. Before/after summary of README improvements
2. Sample PR or incident write-up
${ATTRIBUTION}`,
    },
    {
      key: 'missing-semester/code-quality',
      name: 'Code Quality Demo',
      description: 'Add linting, tests, and optional CI to a project.',
      submissionHint: 'link',
      dueAt: '2026-10-05T23:59:59Z',
      milestone: 'Link to repo with lint, tests, and CI (or local logs).',
      task: `# Project: Code Quality Demo

## Submit via Nibras
- **Submission type:** Link
- Repository with quality tooling

## Include
1. Linter/formatter config file
2. Test command and at least 3 tests
3. CI config or pasted log of lint+test run
${ATTRIBUTION}`,
    },
  ],
};

export async function seedOpenCurriculaProjects(
  prisma: PrismaClient,
  apiBaseUrl: string,
  options?: { log?: (msg: string) => void }
): Promise<number> {
  const log = options?.log ?? (() => {});

  let totalProjects = 0;

  for (const [courseSlug, projects] of Object.entries(PROJECTS)) {
    const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
    if (!course) {
      log(`⚠️  Course not found: ${courseSlug} — run open curricula course seed first`);
      continue;
    }

    const subject = await prisma.subject.upsert({
      where: { slug: courseSlug },
      update: { name: course.courseCode },
      create: { slug: courseSlug, name: course.courseCode },
    });

    log(`📚 ${course.courseCode} (${projects.length} projects)`);

    for (const def of projects) {
      const project = await prisma.project.upsert({
        where: { slug: def.key },
        update: {
          name: def.name,
          description: def.description,
          status: ProjectStatus.published,
          deliveryMode: DeliveryMode.individual,
        },
        create: {
          subjectId: subject.id,
          courseId: course.id,
          slug: def.key,
          name: def.name,
          description: def.description,
          status: ProjectStatus.published,
          deliveryMode: DeliveryMode.individual,
          defaultBranch: 'main',
        },
      });

      const manifest = {
        projectKey: def.key,
        releaseVersion: OPEN_CURRICULA_RELEASE,
        apiBaseUrl,
        defaultBranch: 'main',
        buildpack: { node: '20' },
        test: {
          mode: 'manual',
          supportsPrevious: false,
        },
        submission: {
          allowedPaths: ['.nibras/**', 'README.md', 'docs/**'],
          waitForVerificationSeconds: 60,
        },
      };

      await prisma.projectRelease.upsert({
        where: { projectId_version: { projectId: project.id, version: OPEN_CURRICULA_RELEASE } },
        update: { taskText: def.task, manifestJson: manifest },
        create: {
          projectId: project.id,
          version: OPEN_CURRICULA_RELEASE,
          taskText: def.task,
          manifestJson: manifest,
          publicAssetRef: 'public://open-curricula-seed',
          privateAssetRef: 'private://open-curricula-seed',
        },
      });

      await prisma.milestone.upsert({
        where: { projectId_order: { projectId: project.id, order: 1 } },
        update: {
          title: 'Final Submission',
          description: def.milestone,
          dueAt: new Date(def.dueAt),
          isFinal: true,
        },
        create: {
          projectId: project.id,
          title: 'Final Submission',
          description: def.milestone,
          order: 1,
          dueAt: new Date(def.dueAt),
          isFinal: true,
        },
      });

      log(`   ✅ ${def.name} (${def.submissionHint})`);
      totalProjects++;
    }
  }

  return totalProjects;
}
