/**
 * Open Curricula Seed — MIT Missing Semester and similar public courses.
 * Used by CLI seeds and API runtime bootstrap (production catalog).
 *
 * Attribution: lecture exercises adapted from MIT Missing Semester (CC BY-NC-SA).
 * https://missing.csail.mit.edu/
 */
import type { Prisma, PrismaClient } from '@prisma/client';

const ATTRIBUTION_FOOTER = `
---
*Exercises adapted from [MIT Missing Semester](https://missing.csail.mit.edu/) (CC BY-NC-SA). Complete the official lecture notes for full context.*
`;

type LectureUnit = {
  sectionTitle: string;
  sortOrder: number;
  youtubeId: string;
  assignment: {
    title: string;
    description: string;
    content: string;
    pointsPossible: number;
    dueAt: string;
  };
};

const MISSING_SEMESTER_DESCRIPTION = `Master the command line, editors, version control, debugging, packaging, and modern AI-assisted workflows—the tools CS classes rarely teach in depth.

Official course site: [missing.csail.mit.edu](https://missing.csail.mit.edu/)

Lecture videos © MIT Missing Semester (CC BY-NC-SA). Nibras assignments and projects are adapted practice prompts for self-paced study.`;

const SYLLABUS_JSON: Prisma.InputJsonValue = {
  schedule:
    'Self-paced — work through nine lectures in order. Suggested pace: one lecture every two weeks.',
  topics: [
    'Course Overview + Introduction to the Shell',
    'Command-line Environment',
    'Development Environment and Tools',
    'Debugging and Profiling',
    'Version Control and Git',
    'Packaging and Shipping Code',
    'Agentic Coding',
    'Beyond the Code',
    'Code Quality',
  ],
  policies:
    'Public, self-paced course. Watch lectures in order when sequential unlock is enabled. Submit assignments and project milestones for instructor review. Official MIT materials remain the authoritative reference.',
  sourceUrl: 'https://missing.csail.mit.edu/',
  license: 'CC BY-NC-SA (MIT Missing Semester)',
};

const LECTURES: LectureUnit[] = [
  {
    sectionTitle: 'Lecture 1: Course Overview + Introduction to the Shell',
    sortOrder: 0,
    youtubeId: 'MSgoeuMqUmU',
    assignment: {
      title: 'A1: Shell Navigation and Pipelines',
      description: 'Practice core shell navigation, I/O redirection, and pipelines.',
      dueAt: '2026-06-15T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 1: Shell Navigation and Pipelines

## Goals
Build fluency with the shell: navigation, arguments, redirection, and composing commands.

## Part 1 — Navigation
In a terminal, without using a GUI file manager:
1. Create a directory \`missing-a1\` in your home folder.
2. Inside it, create \`notes.txt\` containing the output of \`date\` and \`uname -a\`.
3. List the tree with \`ls -R\` and capture the output.

## Part 2 — Pipelines
1. Download a small text file (e.g. a README) with \`curl\` or \`wget\`.
2. Count lines, words, and characters using \`wc\`.
3. Build a pipeline that finds the 10 most frequent words (hint: \`tr\`, \`sort\`, \`uniq -c\`, \`sort -nr\`, \`head\`).

## Part 3 — Redirection and \`tee\`
1. Append the current environment (\`env\` or \`printenv\`) to a log file.
2. Use \`tee\` so the same command output appears on screen **and** in a file.

## Deliverable
Submit a short write-up (markdown) with:
- Commands you ran (copy/paste transcript)
- One sentence per part explaining what you learned
- A screenshot or pasted output for the word-frequency pipeline

${ATTRIBUTION_FOOTER}`,
    },
  },
  {
    sectionTitle: 'Lecture 2: Command-line Environment',
    sortOrder: 1,
    youtubeId: 'ccBGsPedE9Q',
    assignment: {
      title: 'A2: Terminal Multiplexing and Dotfiles',
      description: 'Configure tmux and version-control your shell configuration.',
      dueAt: '2026-06-29T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 2: Terminal Multiplexing and Dotfiles

## Part 1 — tmux
1. Start a named session: \`tmux new -s missing-a2\`.
2. Split panes (horizontal and vertical) and run different commands in each.
3. Detach (\`Ctrl-b d\`) and reattach from a new terminal window.

## Part 2 — Dotfiles
1. Initialize a git repo for your dotfiles (e.g. \`.bashrc\`, \`.vimrc\`, or shell equivalent).
2. Add a README explaining how to install on a fresh machine.
3. Make at least one customization (alias, prompt, or editor setting) you will keep.

## Part 3 — Remote machines (optional if no SSH host)
Document the steps you would use to SSH to a remote host and sync dotfiles with \`git clone\`.

## Deliverable
- tmux cheat sheet (5 commands you will actually use)
- Link or description of your dotfiles repository structure
${ATTRIBUTION_FOOTER}`,
    },
  },
  {
    sectionTitle: 'Lecture 3: Development Environment and Tools',
    sortOrder: 2,
    youtubeId: 'QnM1nVzrkx8',
    assignment: {
      title: 'A3: Editor and Dev Environment Audit',
      description: 'Document and improve your editor, shell, and tooling setup.',
      dueAt: '2026-07-13T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 3: Development Environment Audit

## Part 1 — Editor proficiency
Pick Vim, Emacs, or VS Code with a modal extension. Demonstrate:
- Open a file, jump to a line number, search/replace a word
- Use multiple files/buffers or split view
- Record one custom keybinding or plugin you installed

## Part 2 — Shell history and search
1. Configure history size or deduplication (document the setting).
2. Show three ways you locate a past command (\`Ctrl-r\`, \`history | grep\`, etc.).

## Part 3 — Remote development
Describe how you would edit files on a remote server (SSH + editor, Remote-SSH, \`rsync\`, etc.).

## Deliverable
A checklist of your dev environment (editor, shell, package manager, version manager) with one improvement you made this week.
${ATTRIBUTION_FOOTER}`,
    },
  },
  {
    sectionTitle: 'Lecture 4: Debugging and Profiling',
    sortOrder: 3,
    youtubeId: '8VYT9TcUmKs',
    assignment: {
      title: 'A4: Debugging Session',
      description: 'Use a debugger or systematic logging to fix a buggy program.',
      dueAt: '2026-07-27T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 4: Debugging Session

## Setup
Use a small program with a deliberate bug (your own or a provided sample). Languages: C/C++, Python, or JavaScript.

## Part 1 — Reproduce and narrow
1. Write steps to reproduce the failure.
2. Add logging or print statements to localize the fault.

## Part 2 — Debugger
Using \`gdb\`, \`pdb\`, \`node inspect\`, or your IDE debugger:
1. Set a breakpoint before the bug.
2. Inspect variables at failure.
3. Step through at least three lines to confirm your fix.

## Part 3 — Post-mortem
After fixing, write a 3-sentence post-mortem: root cause, fix, prevention.

## Deliverable
Submit your post-mortem plus the corrected code snippet or diff.
${ATTRIBUTION_FOOTER}`,
    },
  },
  {
    sectionTitle: 'Lecture 5: Version Control and Git',
    sortOrder: 4,
    youtubeId: '9K8lB61dl3Y',
    assignment: {
      title: 'A5: Git History and Branching',
      description: 'Practice branches, merges, remotes, and reading history.',
      dueAt: '2026-08-10T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 5: Git History and Branching

## Part 1 — Repository basics
In a new repo:
1. Create \`main\` with an initial commit.
2. Add a feature branch, make two commits, merge with a merge commit (not fast-forward only).

## Part 2 — History
1. Use \`git log --oneline --graph\` after merging.
2. Use \`git blame\` on one line and explain the output.
3. Revert or fix a bad commit using \`git revert\` (preferred) or documented reset.

## Part 3 — Remotes
1. Add a remote (GitHub/GitLab).
2. Push a branch and open a pull/merge request (or describe the steps if private).

## Deliverable
Paste your \`git log --oneline --graph -10\` and a short paragraph on when you use merge vs rebase.
${ATTRIBUTION_FOOTER}`,
    },
  },
  {
    sectionTitle: 'Lecture 6: Packaging and Shipping Code',
    sortOrder: 5,
    youtubeId: 'KBMiB-8P4Ns',
    assignment: {
      title: 'A6: Build and Package a Small Tool',
      description: 'Package a script or library for others to install or run.',
      dueAt: '2026-08-24T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 6: Build and Package

## Choose one track

### Track A — Python
Create a minimal CLI package with \`pyproject.toml\`, a \`__main__\` or console script entry point, and instructions in README.

### Track B — Node.js
Publish-ready \`package.json\` with \`bin\` field, \`npm pack\` tarball, and README install steps.

### Track C — Systems
Makefile or build script that produces a binary; document dependencies.

## Requirements
1. Version number and changelog entry (even if 0.1.0).
2. Document how to run tests (even a one-liner).
3. Explain one release step (tag, GitHub release, or \`pip install\` from git).

## Deliverable
README excerpt (install + usage) and the packaging manifest you created.
${ATTRIBUTION_FOOTER}`,
    },
  },
  {
    sectionTitle: 'Lecture 7: Agentic Coding',
    sortOrder: 6,
    youtubeId: 'sTdz6PZoAnw',
    assignment: {
      title: 'A7: AI-Assisted Workflow Reflection',
      description: 'Use an AI coding assistant responsibly on a real task.',
      dueAt: '2026-09-07T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 7: Agentic Coding

## Part 1 — Task
Pick a small real task (bugfix, test, refactor, or docs). Use an AI assistant (Cursor, Copilot, Claude, etc.) for **at most** 30 minutes of guided help.

## Part 2 — Process log
Record:
1. Your initial prompt
2. One prompt you revised after a bad result
3. What you verified manually (tests, types, security)

## Part 3 — Critical reflection
Answer:
- What did the assistant get wrong?
- What would you not delegate to AI?
- One rule you will follow for agentic coding going forward

## Deliverable
Process log + reflection (no need to submit proprietary code; describe the task at a high level).
${ATTRIBUTION_FOOTER}`,
    },
  },
  {
    sectionTitle: 'Lecture 8: Beyond the Code',
    sortOrder: 7,
    youtubeId: '2DOEATfXT8k',
    assignment: {
      title: 'A8: Documentation and Communication',
      description: 'Write documentation that helps another developer succeed.',
      dueAt: '2026-09-21T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 8: Beyond the Code

## Part 1 — README
Improve a README (personal project or open source) to include:
- What / why / how to run
- Prerequisites and install
- How to contribute or report issues

## Part 2 — Operational docs
Add one of: troubleshooting section, architecture diagram (ASCII ok), or runbook for deploy.

## Part 3 — Communication
Write a sample PR description or incident summary (5–10 sentences) for a fictional bugfix.

## Deliverable
Submit the README sections you added and the PR/incident write-up.
${ATTRIBUTION_FOOTER}`,
    },
  },
  {
    sectionTitle: 'Lecture 9: Code Quality',
    sortOrder: 8,
    youtubeId: 'XBiLUNx84CQ',
    assignment: {
      title: 'A9: Linting, Tests, and CI',
      description: 'Add automated quality checks to a small project.',
      dueAt: '2026-10-05T23:59:59Z',
      pointsPossible: 100,
      content: `# Assignment 9: Code Quality

## Part 1 — Linter / formatter
Add ESLint, Ruff, \`clang-format\`, or equivalent. Fix at least three warnings.

## Part 2 — Tests
Add at least three automated tests (unit or integration). Document how to run them.

## Part 3 — CI (optional but recommended)
Add a GitHub Actions (or similar) workflow that runs lint + tests on push.

## Deliverable
- Command to run tests locally
- Screenshot or log snippet of CI/lint passing
- One paragraph: what quality gate mattered most for your project?
${ATTRIBUTION_FOOTER}`,
    },
  },
];

const OPEN_COURSES = [
  {
    slug: 'missing-semester',
    courseCode: 'MISSING',
    title: 'The Missing Semester of Your CS Education',
    termLabel: 'Self-Paced',
    description: MISSING_SEMESTER_DESCRIPTION,
    sequentialVideos: true,
    syllabusJson: SYLLABUS_JSON,
    lectures: LECTURES,
  },
];

async function upsertLectureVideos(
  prisma: PrismaClient,
  courseId: string,
  lectures: LectureUnit[],
  sequential: boolean,
  log: (msg: string) => void
): Promise<void> {
  let previousVideoId: string | null = null;

  for (const lecture of lectures) {
    let section = await prisma.courseSection.findFirst({
      where: { courseId, title: lecture.sectionTitle },
    });
    if (!section) {
      section = await prisma.courseSection.create({
        data: {
          courseId,
          title: lecture.sectionTitle,
          sortOrder: lecture.sortOrder,
        },
      });
    } else {
      section = await prisma.courseSection.update({
        where: { id: section.id },
        data: { sortOrder: lecture.sortOrder },
      });
    }

    const videoTitle = lecture.sectionTitle.replace(/^Lecture \d+: /, '');
    let video = await prisma.courseVideo.findFirst({
      where: { sectionId: section.id, title: videoTitle },
    });

    const videoData: {
      title: string;
      description: string;
      provider: 'youtube';
      externalId: string;
      embedUrl: string | null;
      sortOrder: number;
      requiresVideoId: string | null;
    } = {
      title: videoTitle,
      description: `MIT Missing Semester — ${lecture.sectionTitle}`,
      provider: 'youtube',
      externalId: lecture.youtubeId,
      embedUrl: null,
      sortOrder: 0,
      requiresVideoId: sequential && previousVideoId ? previousVideoId : null,
    };

    if (!video) {
      video = await prisma.courseVideo.create({
        data: { sectionId: section.id, ...videoData },
      });
    } else {
      video = await prisma.courseVideo.update({
        where: { id: video.id },
        data: videoData,
      });
    }

    previousVideoId = video.id;
    log(`   🎬 Video: ${videoTitle} (${lecture.youtubeId})`);
  }
}

export async function seedOpenCurricula(
  prisma: PrismaClient,
  options?: { log?: (msg: string) => void }
): Promise<void> {
  const log = options?.log ?? (() => {});

  for (const def of OPEN_COURSES) {
    await prisma.subject.upsert({
      where: { slug: def.slug },
      update: { name: def.courseCode },
      create: { slug: def.slug, name: def.courseCode },
    });

    const course = await prisma.course.upsert({
      where: { slug: def.slug },
      update: {
        title: def.title,
        termLabel: def.termLabel,
        courseCode: def.courseCode,
        description: def.description,
        syllabusJson: def.syllabusJson,
        sequentialVideos: def.sequentialVideos,
        isActive: true,
        isPublic: true,
      },
      create: {
        slug: def.slug,
        title: def.title,
        termLabel: def.termLabel,
        courseCode: def.courseCode,
        description: def.description,
        syllabusJson: def.syllabusJson,
        sequentialVideos: def.sequentialVideos,
        isActive: true,
        isPublic: true,
      },
    });
    log(`✅ Course: ${def.courseCode} — ${def.title}`);

    for (const lecture of def.lectures) {
      const existingSection = await prisma.courseSection.findFirst({
        where: { courseId: course.id, title: lecture.sectionTitle },
      });
      if (!existingSection) {
        await prisma.courseSection.create({
          data: {
            courseId: course.id,
            title: lecture.sectionTitle,
            sortOrder: lecture.sortOrder,
          },
        });
      }
      log(`   📁 Section: ${lecture.sectionTitle}`);
    }

    await upsertLectureVideos(prisma, course.id, def.lectures, def.sequentialVideos, log);

    for (const lecture of def.lectures) {
      const asgn = lecture.assignment;
      const existing = await prisma.courseAssignment.findFirst({
        where: { courseId: course.id, title: asgn.title },
      });
      const assignmentData = {
        description: asgn.description,
        content: asgn.content,
        pointsPossible: asgn.pointsPossible,
        sortOrder: lecture.sortOrder,
        dueAt: new Date(asgn.dueAt),
        published: true,
      };
      if (!existing) {
        await prisma.courseAssignment.create({
          data: {
            courseId: course.id,
            title: asgn.title,
            ...assignmentData,
          },
        });
        log(`   📝 Assignment: ${asgn.title}`);
      } else {
        await prisma.courseAssignment.update({
          where: { id: existing.id },
          data: assignmentData,
        });
        log(`   🔄 Assignment: ${asgn.title}`);
      }
    }
  }
}
