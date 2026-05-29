import type { LandingIconId } from './landing-icons';

export type LandingFeature = {
  icon: LandingIconId;
  title: string;
  desc: string;
};

export type LandingFeatureGroup = {
  id: string;
  label: string;
  navLabel: string;
  features: LandingFeature[];
};

export const heroBadge =
  'Early Access · Catalog LMS, daily practice, public profiles, community v2 & more';

export const heroSub =
  'One platform for courses, projects, planning, and delivery — with My Courses (lectures, MCQ/quizzes, video progress, grades), dashboard deadlines, Hassona tutoring, community v2 (votes and bookmarks), daily problem streaks, competitions calendar, public profiles, in-browser IDE, and GitHub-native CLI submissions.';

export const whatsNew = [
  'Catalog LMS — lectures, MCQ/quizzes, and video watch progress in My Courses',
  'Community v2 — votes, bookmarks, reputation hooks, and moderation',
  'Daily problem + public profiles — streaks at /competitions/daily, shareable /users/[id]',
] as const;

export const statsBar = [
  { number: '20+', label: 'Connected workflows in one system' },
  { number: '8+', label: 'Student surfaces beyond the LMS' },
  { number: '24/7', label: 'Course operations visibility' },
] as const;

export const mockupUrl = 'nibrasplatform.me/dashboard';

export const mockupSidebar = [
  { label: 'Dashboard', active: true },
  { label: 'Projects', active: false },
  { label: 'Planner', active: false },
  { label: 'Hassona', active: false },
  { label: 'My Courses', active: false },
  { label: 'Q&A', active: false },
  { label: 'Discussions', active: false },
  { label: 'Nibras 75', active: false },
  { label: 'Badges', active: false },
  { label: 'Levels', active: false },
] as const;

export const mockupStatCards = [
  { label: 'Deadlines', value: '3', sub: 'Due this week' },
  { label: 'Reputation', value: '1.2k', sub: 'Points this term' },
  { label: 'Daily streak', value: '7', sub: 'Days in a row' },
] as const;

export const mockupCommunityQuestions = [
  {
    title: 'Why does merge sort need O(n) extra space?',
    votes: 5,
    answers: 2,
    tag: 'cs161',
  },
  {
    title: 'Capstone API design — REST vs RPC?',
    votes: 3,
    answers: 1,
    tag: 'capstone',
  },
] as const;

export const canvasSurfaceChips = ['dashboard', 'cli', 'hassona', 'community'] as const;

export const featuresShowcaseCopy = {
  eyebrow: 'Features',
  titleBright: 'One platform. ',
  titleDim: 'Three\u00a0surfaces.',
  sub: 'Academic, delivery, and engagement — pick a surface on the left; the terminal lists every module inside at a glance.',
} as const;

export const cliShowcaseCopy = {
  eyebrow: 'CLI',
  titleBright: 'GitHub-native delivery. ',
  titleDim: 'Terminal-native.',
  sub: 'The same session layout as the rest of the page — pick a workflow on the left and watch the CLI run it live on the right.',
} as const;

export type CliShowcaseTile = {
  slug: string;
  name: string;
  label: string;
  desc: string;
  /** SVG filename in `public/landing/cli-tiles/` (defaults to `{slug}.svg`). */
  iconFile?: string;
  accent: string;
  command: string;
  lines: ReadonlyArray<{
    kind: 'muted' | 'ok' | 'warn' | 'text' | 'highlight' | 'progress';
    text: string;
  }>;
};

export const cliShowcaseTiles: readonly CliShowcaseTile[] = [
  {
    slug: 'submit',
    name: 'submit',
    label: 'Submit workflow',
    desc: 'Stage, push, and verify — with live feedback on every step.',
    accent: '#22c55e',
    command: 'nibras submit',
    lines: [
      { kind: 'muted', text: 'Staging allowed files…' },
      { kind: 'ok', text: '✓ Staged 3 files' },
      { kind: 'ok', text: '✓ Pushed commit a3f7c1d' },
      { kind: 'progress', text: 'Verifying ██████████░░░░░░░░ 70%' },
    ],
  },
  {
    slug: 'status',
    name: 'status',
    label: 'Status & polling',
    desc: 'Visual verification polling with clear progress indicators.',
    accent: '#38bdf8',
    command: 'nibras status --watch',
    lines: [
      { kind: 'muted', text: 'submission hw2-sorting · verifying' },
      { kind: 'progress', text: '████████████░░░░░░░░ 62%' },
      { kind: 'text', text: 'last event: test suite running' },
      { kind: 'muted', text: 'poll interval 2s · ctrl+c to exit' },
    ],
  },
  {
    slug: 'result',
    name: 'result',
    label: 'Pass / fail summary',
    desc: 'Boxed result cards with scores and colour-coded borders.',
    accent: '#f97316',
    command: 'nibras status --last',
    lines: [
      { kind: 'ok', text: '╭──────────────────────────────────╮' },
      { kind: 'ok', text: '│ ✓ Submission passed              │' },
      { kind: 'text', text: '│ Score: 94 / 100                  │' },
      { kind: 'ok', text: '╰──────────────────────────────────╯' },
    ],
  },
  {
    slug: 'workflow',
    name: 'workflow',
    label: 'Developer workflows',
    desc: 'Login, doctor, and config — native to your terminal.',
    accent: '#a855f7',
    command: 'nibras doctor',
    lines: [
      { kind: 'ok', text: '✓ API reachable' },
      { kind: 'ok', text: '✓ GitHub token valid' },
      { kind: 'ok', text: '✓ project manifest found' },
      { kind: 'highlight', text: 'ready · run nibras submit' },
    ],
  },
] as const;

export const mockupTableRows = [
  {
    student: 'Capstone Team Project',
    project: 'Projects',
    status: 'passed' as const,
    score: 'Active',
  },
  {
    student: 'HW2 — Sorting',
    project: 'My Courses',
    status: 'pending' as const,
    score: 'Due Fri',
  },
  {
    student: 'Midterm Grade',
    project: 'Grades',
    status: 'passed' as const,
    score: '88%',
  },
  {
    student: 'Applied Systems Track',
    project: 'Planner',
    status: 'passed' as const,
    score: 'Selected',
  },
  {
    student: 'Nibras 75 Practice',
    project: 'Compete',
    status: 'passed' as const,
    score: '42 solved',
  },
  {
    student: 'Two Sum — IDE',
    project: 'Code Playground',
    status: 'passed' as const,
    score: 'Accepted',
  },
  {
    student: 'Study Group Thread',
    project: 'Discussions',
    status: 'pending' as const,
    score: '8 replies',
  },
  {
    student: 'Community Helper',
    project: 'Levels',
    status: 'pending' as const,
    score: 'Tier 4',
  },
] as const;

export const howItWorksSteps = [
  {
    step: '01',
    icon: 'timeline-templates' as const,
    title: 'Connect your GitHub',
    desc: 'Sign in once — your identity, submissions, and reputation are tracked automatically. No passwords, no forms.',
    cta: null,
    href: null,
  },
  {
    step: '02',
    icon: 'timeline-people' as const,
    title: 'Open your academic workspace',
    desc: 'Enroll in courses, join or form project teams, plan your program, and ask questions — all from one dashboard.',
    cta: 'View CLI guide →',
    href: '/instructor/onboarding',
  },
  {
    step: '03',
    icon: 'timeline-delivery' as const,
    title: 'Deliver work and level up',
    desc: "Submit from the terminal, practice in the IDE, earn badges, and see your progress across every course you're in.",
    cta: 'Sign in to begin →',
    href: '/sign-in',
  },
] as const;

export const transformPains = [
  'Project setup recreated manually every time a course runs',
  'Role preferences and team formation handled in forms and spreadsheets',
  'Program requirements, tracks, and petitions managed outside the product',
  'LMS, practice sites, and tutoring spread across tabs with no shared deadlines view',
  'Submissions, planning, and review state living in disconnected tools',
  'AI tutoring, forums, contests, and gamification spread across separate apps',
  'Daily practice and contest schedules tracked on external sites and spreadsheets',
] as const;

export const transformGains = [
  'Reusable templates define roles, team size, milestones, and rubric structure',
  'Students apply for roles, instructors generate teams, and final rosters get locked in one flow',
  'Planner workspaces track requirements, tracks, petitions, approvals, and printable sheets',
  'My Courses, dashboard deadlines, and enrolled-course content live beside projects and planning',
  'Students submit with one CLI command and practice code in a built-in IDE',
  'Hassona, Q&A, Discussions, competitions, IDE, badges, and Levels share one reputation layer',
  'Daily problem, Nibras 75, and a competitions calendar live in one compete hub',
] as const;

export const transformSub =
  'See what changes when courses, planning, submissions, tutoring, practice, and motivation finally live together.';

export const featureGroups: LandingFeatureGroup[] = [
  {
    id: 'features-academic',
    label: 'Academic operations',
    navLabel: 'For instructors',
    features: [
      {
        icon: 'templates',
        title: 'Project Templates',
        desc: 'Launch repeatable project blueprints with milestones, team size, roles, and rubric structure already defined.',
      },
      {
        icon: 'role-apps',
        title: 'Role Applications',
        desc: 'Students rank the roles they want, explain fit, and enter team formation through a structured workflow.',
      },
      {
        icon: 'team-formation',
        title: 'Team Formation',
        desc: 'Review applications, generate suggested teams, and lock final rosters without spreadsheet coordination.',
      },
      {
        icon: 'planner',
        title: 'Program Planner',
        desc: 'Track requirements, choose tracks, manage petitions, approvals, and generate printable program sheets.',
      },
      {
        icon: 'catalog',
        title: 'Project Catalog',
        desc: 'Browse templates and apply to projects across all enrolled courses from one catalog.',
      },
      {
        icon: 'courses',
        title: 'My Courses',
        desc: 'Lecture player, assignments, MCQ/quiz types, video watch progress, and grades — enrolled-course hub without a separate LMS tab.',
      },
      {
        icon: 'course-ops',
        title: 'Course Operations',
        desc: 'Keep courses, projects, review queues, join links, and instructor actions visible in one system with less switching and less admin drag.',
      },
      {
        icon: 'instructor-analytics',
        title: 'Instructor Analytics',
        desc: 'See cross-course submissions, pass rates, engagement, and student risk signals in one analytics view.',
      },
    ],
  },
  {
    id: 'features-delivery',
    label: 'Delivery & insight',
    navLabel: 'Delivery',
    features: [
      {
        icon: 'dashboard',
        title: 'Smart Dashboard',
        desc: 'See overall stats, upcoming deadlines, and per-course snapshots the moment you sign in — student and instructor modes.',
      },
      {
        icon: 'github-cli',
        title: 'GitHub + CLI',
        desc: 'Students submit through a clean developer workflow with GitHub history, live CLI feedback, device login, and verifiable delivery.',
      },
      {
        icon: 'ide',
        title: 'In-browser IDE',
        desc: 'Write, run, and judge code in Monaco with multi-language support — practice problems without leaving the platform.',
      },
      {
        icon: 'notifications',
        title: 'In-app Notifications',
        desc: 'Get notified when your submission is reviewed, graded, or needs changes — instantly in-app and by email, with granular preferences.',
      },
      {
        icon: 'submission-analytics',
        title: 'Submission Analytics',
        desc: "Track your submission history with per-course and per-project analytics — see what's passed, pending, and needs attention.",
      },
      {
        icon: 'track-recommendations',
        title: 'Track Recommendations',
        desc: 'The planner recommends the best program tracks based on your Year 1 course selections and academic goals.',
      },
      {
        icon: 'course-ops',
        title: 'Review Workspace',
        desc: 'Work through submission queues, status filters, and review actions without leaving the delivery surface.',
      },
      {
        icon: 'instructor-analytics',
        title: 'Operational Insights',
        desc: 'Spot pass-rate trends, backlog risk, and course-level bottlenecks before they turn into end-of-term surprises.',
      },
    ],
  },
  {
    id: 'features-engagement',
    label: 'Student engagement & motivation',
    navLabel: 'For students',
    features: [
      {
        icon: 'hassona',
        title: 'Hassona',
        desc: 'Chat with an AI tutor, review learning insights, use smart routing, and get grade-aware recommendations beside your coursework.',
      },
      {
        icon: 'community',
        title: 'Community Q&A',
        desc: 'Ask with markdown, vote on answers, earn reputation, bookmark threads, and get course-scoped help with moderation built in.',
      },
      {
        icon: 'discussions',
        title: 'Course Discussions',
        desc: 'Long-form threads scoped to enrolled courses — public read-only views, study groups, and async conversation beside Q&A.',
      },
      {
        icon: 'competitions',
        title: 'Competitions',
        desc: 'Nibras 75, Codeforces, Code Hunt, week/day contest calendar, daily problem with streaks and freezes, platforms, and ranked history.',
      },
      {
        icon: 'achievements',
        title: 'Achievements & Badges',
        desc: 'Earn from an expanded badge catalog with retroactive awards, full progress visibility, leaderboards, and reputation tracking.',
      },
      {
        icon: 'levels',
        title: 'Levels',
        desc: 'Climb tier progression based on reputation and real contributions — from helper badges to competitive milestones.',
      },
      {
        icon: 'competitions',
        title: 'Daily Problem',
        desc: 'One curated problem per day — solve, skip, or pause, track streaks on a calendar, and earn daily badges at /competitions/daily.',
      },
      {
        icon: 'community',
        title: 'Public Profiles',
        desc: 'Shareable /users/[id] pages with course progress, submissions, and badges — visibility scoped to viewer role.',
      },
    ],
  },
];

export const landingNavLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '/docs', label: 'Docs' },
  { href: '/changelog', label: 'Changelog' },
] as const;

export const cliFeatures = [
  {
    icon: '◉',
    label: 'Live feedback on every step',
    desc: 'Real-time status on every async operation — no silent waiting.',
  },
  {
    icon: '█',
    label: 'Progress you can actually see',
    desc: 'Visual verification polling with clear progress indicators.',
  },
  {
    icon: '╭',
    label: 'Clear pass/fail summaries',
    desc: 'Boxed result cards with scores and colour-coded borders.',
  },
  {
    icon: '∿',
    label: 'Built for real developer workflows',
    desc: 'Feels native to the terminal — not bolted on as an afterthought.',
  },
] as const;

export const supportNotice = {
  eyebrow: 'Support the project',
  body: 'Help us keep nibrasplatform.me free and actively maintained. If you or your company find it useful, consider supporting the project.',
  email: 'support@nibrasplatform.me',
} as const;

export const landingFooterContactEmail = supportNotice.email;

export const ctaFeatures = [
  'Free during early access',
  'GitHub or email magic link',
  'No credit card required',
] as const;

/** @deprecated Use landingNavLinks — kept for any external imports */
export const featureNavLinks = featureGroups.map((g) => ({
  href: `#${g.id}`,
  label: g.navLabel,
}));
