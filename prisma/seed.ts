import {
  AssetVisibility,
  DeliveryMode,
  PrismaClient,
  ProjectStatus,
  SystemRole,
} from '@prisma/client';
import {
  buildCs106lManifest,
  buildCs106lStarter,
  CS106L_COURSE,
  listCs106lProjectDefinitions,
  readCs106lTaskText,
} from '../apps/api/src/lib/cs106l';
import {
  BADGE_CATALOG,
  badgeSeedToDefinition,
} from '../apps/api/src/features/gamification/badges-catalog';

const prisma = new PrismaClient();

async function main() {
  // ── 1. Admin user ─────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@nibras.local' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@nibras.local',
      systemRole: SystemRole.admin,
    },
  });
  console.log('✅ Admin user: admin@nibras.local (systemRole: admin)');

  await prisma.user.upsert({
    where: { email: 'support@nibrasplatform.me' },
    update: {
      username: 'support',
      displayName: 'Nibras Support',
      systemRole: SystemRole.admin,
      emailVerified: true,
    },
    create: {
      username: 'support',
      email: 'support@nibrasplatform.me',
      displayName: 'Nibras Support',
      systemRole: SystemRole.admin,
      emailVerified: true,
    },
  });
  console.log('✅ Support user: support@nibrasplatform.me (systemRole: admin)');

  // ── 2. Demo Subject ───────────────────────────────────────────────────────
  const subject = await prisma.subject.upsert({
    where: { slug: 'cs161' },
    update: {},
    create: {
      slug: 'cs161',
      name: 'Introduction to Computer Science',
    },
  });
  console.log('✅ Subject: cs161 — Introduction to Computer Science');

  // ── 3. Demo Course ────────────────────────────────────────────────────────
  const course = await prisma.course.upsert({
    where: { slug: 'cs161' },
    update: {},
    create: {
      slug: 'cs161',
      title: 'CS161 — Introduction to Computer Science',
      termLabel: 'Spring 2026',
      courseCode: 'CS161',
      isActive: true,
    },
  });
  console.log('✅ Course: CS161 — Introduction to Computer Science (Spring 2026)');

  // ── 4. Demo Project ───────────────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { slug: 'cs161/exam1' },
    update: {},
    create: {
      subjectId: subject.id,
      courseId: course.id,
      slug: 'cs161/exam1',
      name: 'Exam 1',
      description:
        'First exam: implement basic JavaScript functions and pass the automated test suite.',
      status: ProjectStatus.published,
      deliveryMode: DeliveryMode.individual,
      defaultBranch: 'main',
    },
  });
  console.log('✅ Project: cs161/exam1 — Exam 1 (published, individual)');

  // ── 5. Demo Project Release (manifest + task) ─────────────────────────────
  const manifest = {
    projectKey: 'cs161/exam1',
    releaseVersion: '2026-03-01',
    apiBaseUrl: 'https://nibras-api.fly.dev',
    defaultBranch: 'main',
    buildpack: { node: '20' },
    test: {
      mode: 'public-grading',
      command: 'node --test test/solution.test.js',
      supportsPrevious: true,
    },
    submission: {
      allowedPaths: ['.nibras/**', 'src/**', 'test/**', 'README.md', 'package.json'],
      waitForVerificationSeconds: 30,
    },
  };

  const taskText = `# Exam 1 — JavaScript Fundamentals

## Overview

Complete the three functions in \`src/solution.js\`. Each function is tested automatically when you submit.

---

## Part 1 — Sum

Implement a function that returns the sum of two numbers.

\`\`\`js
// src/solution.js
function sum(a, b) {
  // TODO: your code here
}
\`\`\`

**Example:**
\`\`\`
sum(2, 3)  → 5
sum(-1, 1) → 0
\`\`\`

---

## Part 2 — Factorial

Implement a function that returns the factorial of a non-negative integer.

\`\`\`js
function factorial(n) {
  // TODO: your code here
}
\`\`\`

**Example:**
\`\`\`
factorial(0) → 1
factorial(5) → 120
\`\`\`

---

## Part 3 — Palindrome

Implement a function that returns \`true\` if the given string is a palindrome (reads the same forwards and backwards, case-insensitive), \`false\` otherwise.

\`\`\`js
function isPalindrome(str) {
  // TODO: your code here
}
\`\`\`

**Example:**
\`\`\`
isPalindrome("racecar") → true
isPalindrome("hello")   → false
isPalindrome("Madam")   → true
\`\`\`

---

## How to Submit

1. Run \`nibras test\` to check your work locally
2. Run \`nibras submit\` when your tests pass

Good luck! 🚀
`;

  await prisma.projectRelease.upsert({
    where: { projectId_version: { projectId: project.id, version: '2026-03-01' } },
    update: {},
    create: {
      projectId: project.id,
      version: '2026-03-01',
      taskText,
      manifestJson: manifest,
      publicAssetRef: 'public://seed',
      privateAssetRef: 'private://seed',
    },
  });
  console.log('✅ Project release: 2026-03-01');

  // ── 6. Demo Milestone ─────────────────────────────────────────────────────
  await prisma.milestone.upsert({
    where: { projectId_order: { projectId: project.id, order: 1 } },
    update: {},
    create: {
      projectId: project.id,
      title: 'Submission 1',
      description: 'Complete all three functions and pass the automated test suite.',
      order: 1,
      dueAt: new Date('2026-05-01T23:59:59Z'),
      isFinal: true,
    },
  });
  console.log('✅ Milestone: "Submission 1" (due 2026-05-01, final)');

  const cs106lSubject = await prisma.subject.upsert({
    where: { slug: CS106L_COURSE.slug },
    update: { name: CS106L_COURSE.courseCode },
    create: {
      slug: CS106L_COURSE.slug,
      name: CS106L_COURSE.courseCode,
    },
  });
  console.log(`✅ Subject: ${CS106L_COURSE.slug} — ${CS106L_COURSE.courseCode}`);

  const cs106lCourse = await prisma.course.upsert({
    where: { slug: CS106L_COURSE.slug },
    update: {
      title: CS106L_COURSE.title,
      termLabel: CS106L_COURSE.termLabel,
      courseCode: CS106L_COURSE.courseCode,
      isActive: true,
    },
    create: {
      slug: CS106L_COURSE.slug,
      title: CS106L_COURSE.title,
      termLabel: CS106L_COURSE.termLabel,
      courseCode: CS106L_COURSE.courseCode,
      isActive: true,
    },
  });
  console.log(`✅ Course: ${CS106L_COURSE.title} (${CS106L_COURSE.termLabel})`);

  for (const definition of listCs106lProjectDefinitions()) {
    const cs106lProject = await prisma.project.upsert({
      where: { slug: definition.projectKey },
      update: {
        subjectId: cs106lSubject.id,
        courseId: cs106lCourse.id,
        name: definition.title,
        description: definition.description,
        status: ProjectStatus.published,
        deliveryMode: DeliveryMode.individual,
        defaultBranch: 'main',
      },
      create: {
        subjectId: cs106lSubject.id,
        courseId: cs106lCourse.id,
        slug: definition.projectKey,
        name: definition.title,
        description: definition.description,
        status: ProjectStatus.published,
        deliveryMode: DeliveryMode.individual,
        defaultBranch: 'main',
      },
    });

    const manifest = buildCs106lManifest('https://nibras-api.fly.dev', definition.projectKey);
    const taskText = readCs106lTaskText(definition.projectKey);
    const starter = buildCs106lStarter(definition.projectKey);
    const release = await prisma.projectRelease.upsert({
      where: {
        projectId_version: {
          projectId: cs106lProject.id,
          version: manifest.releaseVersion,
        },
      },
      update: {
        taskText,
        manifestJson: manifest,
      },
      create: {
        projectId: cs106lProject.id,
        version: manifest.releaseVersion,
        taskText,
        manifestJson: manifest,
        publicAssetRef: 'public://seed',
        privateAssetRef: 'private://seed',
      },
    });

    await prisma.projectAsset.deleteMany({
      where: { projectReleaseId: release.id, kind: 'starter-bundle' },
    });
    await prisma.projectAsset.create({
      data: {
        projectReleaseId: release.id,
        visibility: AssetVisibility.private,
        kind: 'starter-bundle',
        storageKey: starter.storageKey,
      },
    });

    await prisma.milestone.upsert({
      where: { projectId_order: { projectId: cs106lProject.id, order: 1 } },
      update: {
        title: 'Initial Submission',
        description: definition.milestoneDescription,
        dueAt: null,
        isFinal: true,
      },
      create: {
        projectId: cs106lProject.id,
        title: 'Initial Submission',
        description: definition.milestoneDescription,
        order: 1,
        dueAt: null,
        isFinal: true,
      },
    });

    console.log(`✅ Project: ${definition.projectKey} — ${definition.title}`);
  }

  // ── Badge catalog ─────────────────────────────────────────────────────────
  for (const badge of BADGE_CATALOG) {
    const data = badgeSeedToDefinition(badge);
    await prisma.badgeDefinition.upsert({
      where: { code: badge.code },
      create: data,
      update: data,
    });
  }
  console.log(`✅ Badge catalog: ${BADGE_CATALOG.length} definitions`);

  console.log('');
  console.log('🎉 Demo seed complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Fill in GitHub App credentials in .env');
  console.log('  2. Set GITHUB_TEMPLATE_OWNER and GITHUB_TEMPLATE_REPO in .env');
  console.log('  3. Run: npm run build && npm run dev');
  console.log('  4. Open http://localhost:3000 and log in with GitHub');
  console.log('  5. Student: nibras login → nibras setup --project cs106l/gapbuffer');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
