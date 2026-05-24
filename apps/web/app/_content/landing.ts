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

export const heroBadge = 'Early Access · Templates, IDE, achievements & more';

export const heroSub =
  'One platform for courses, projects, planning, and delivery — plus Hassona tutoring, community Q&A, competitive practice, in-browser IDE, reputation & badges, and GitHub-native CLI submissions.';

export const statsBar = [
  { number: '20+', label: 'Connected workflows in one system' },
  { number: '6', label: 'Student surfaces beyond the LMS' },
  { number: '24/7', label: 'Course operations visibility' },
] as const;

export const mockupUrl = 'nibrasplatform.me/dashboard';

export const mockupSidebar = [
  { label: 'Dashboard', active: true },
  { label: 'Catalog', active: false },
  { label: 'Planner', active: false },
  { label: 'Hassona', active: false },
  { label: 'IDE', active: false },
  { label: 'Community', active: false },
  { label: 'Competitions', active: false },
  { label: 'Achievements', active: false },
] as const;

export const mockupStatCards = [
  { label: 'Templates', value: '6', sub: 'Reusable blueprints' },
  { label: 'Reputation', value: '1.2k', sub: 'Points this term' },
  { label: 'Nibras 75', value: '42', sub: 'Problems solved' },
] as const;

export const mockupTableRows = [
  {
    student: 'Capstone Team Project',
    project: 'Template',
    status: 'passed' as const,
    score: 'Active',
  },
  {
    student: 'Role Preferences',
    project: 'Team Formation',
    status: 'pending' as const,
    score: '12 apps',
  },
  {
    student: 'Applied Systems Track',
    project: 'Planner',
    status: 'passed' as const,
    score: 'Selected',
  },
  {
    student: 'Graduation Sheet',
    project: 'Program Sheet',
    status: 'failed' as const,
    score: 'Advisor review',
  },
  {
    student: 'Nibras 75 Practice',
    project: 'Competitions',
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
    student: 'Community Helper',
    project: 'Achievements',
    status: 'pending' as const,
    score: '3 badges',
  },
] as const;

export const howItWorksSteps = [
  {
    step: '01',
    icon: 'timeline-templates' as const,
    title: 'Define the system',
    desc: 'Create courses, reusable templates, milestones, team roles, and academic program structure in one place.',
    cta: 'Open dashboard →',
    href: '/dashboard',
  },
  {
    step: '02',
    icon: 'timeline-people' as const,
    title: 'Coordinate people and plans',
    desc: 'Collect role applications, generate teams, run community discussions, route petitions, and keep students on track with Hassona and achievements.',
    cta: 'View CLI guide →',
    href: '/instructor/onboarding',
  },
  {
    step: '03',
    icon: 'timeline-delivery' as const,
    title: 'Run delivery and review',
    desc: 'Students submit from the terminal, practice in the IDE, earn reputation, and instructors review with analytics visible all semester.',
    cta: null,
    href: null,
  },
] as const;

export const transformPains = [
  'Project setup recreated manually every time a course runs',
  'Role preferences and team formation handled in forms and spreadsheets',
  'Program requirements, tracks, and petitions managed outside the product',
  'Students jumping between portals, IDEs, and practice sites to know what comes next',
  'Submissions, planning, and review state living in disconnected tools',
  'AI tutoring, forums, contests, and gamification spread across separate apps',
] as const;

export const transformGains = [
  'Reusable templates define roles, team size, milestones, and rubric structure',
  'Students apply for roles, instructors generate teams, and final rosters get locked in one flow',
  'Planner workspaces track requirements, tracks, petitions, approvals, and printable sheets',
  'Students submit with one CLI command and practice code in a built-in IDE',
  'Courses, projects, planning, and review stay visible in the same operating layer',
  'Hassona, community, competitions, IDE, and achievements share one reputation layer',
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
    label: 'Delivery and insight',
    navLabel: 'Delivery',
    features: [
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
        desc: 'Get notified when your submission is reviewed, graded, or needs changes — instantly in-app and by email.',
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
    ],
  },
  {
    id: 'features-engagement',
    label: 'Student engagement',
    navLabel: 'For students',
    features: [
      {
        icon: 'hassona',
        title: 'Hassona',
        desc: 'Chat with an AI tutor, review learning insights, use smart routing, and get grade-aware recommendations beside your coursework.',
      },
      {
        icon: 'community',
        title: 'Community',
        desc: 'Ask questions with markdown, vote on answers, browse tags, and join course-scoped discussions and threads.',
      },
      {
        icon: 'competitions',
        title: 'Competitions',
        desc: 'Practice Nibras 75, Codeforces problems, contest calendars, platform integrations, and ranked competitive history.',
      },
      {
        icon: 'achievements',
        title: 'Achievements & Reputation',
        desc: 'Earn badges retroactively, build reputation from real activity, climb leaderboards, and track level progression.',
      },
    ],
  },
];

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

export const testimonials = [
  {
    quote:
      'Nibras completely changed how I run our capstone sequence. Templates keep projects consistent, role applications are structured, and I no longer have to glue team formation together by hand.',
    name: 'Sarah Chen',
    role: 'CS Instructor, State University',
    initials: 'SC',
  },
  {
    quote:
      'We used to split planning, petitions, and delivery across too many tools. Now students can see their track, sheet, submissions, and project status in one place, which cuts confusion immediately.',
    name: 'Marcus Wright',
    role: 'Program Lead, TechPath',
    initials: 'MW',
  },
  {
    quote:
      'The GitHub-backed submissions are still excellent, but the bigger win is that courses, templates, teams, and program operations now feel like one connected product instead of separate processes.',
    name: 'Priya Nair',
    role: 'Data Science Professor',
    initials: 'PN',
  },
  {
    quote:
      'I used to bounce between Discord, LeetCode, and our LMS. With Hassona, the IDE, achievements, and Nibras 75 beside my projects, I always know what to work on next.',
    name: 'Alex Rivera',
    role: 'CS Student, State University',
    initials: 'AR',
  },
] as const;

export const ctaFeatures = [
  'Free during early access',
  'GitHub login — no passwords',
  'No credit card required',
] as const;

export const featureNavLinks = featureGroups.map((g) => ({
  href: `#${g.id}`,
  label: g.navLabel,
  /** Pulsing “New” pill in top nav — all audience shortcuts */
  isNew: true,
}));
