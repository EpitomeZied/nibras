export type NavVisibility = 'all' | 'instructor' | 'admin';

/** Where the item appears in the top header. */
export type NavPlacement =
  | 'primary'
  | 'learn'
  | 'community'
  | 'compete'
  | 'achievements'
  | 'teach'
  | 'admin';

export type NavGroupId = 'learn' | 'community' | 'compete' | 'achievements' | 'teach';

export type AppNavItem = {
  href: string;
  label: string;
  description: string;
  visibility: NavVisibility;
  placement: NavPlacement;
  /** When true, only exact href + matchPrefixes apply (not all paths under href). */
  exactHref?: boolean;
  matchPrefixes?: string[];
};

export type NavDropdownGroup = {
  id: NavGroupId;
  label: string;
  description: string;
};

export const navDropdownGroups: NavDropdownGroup[] = [
  {
    id: 'learn',
    label: 'Learn',
    description: 'Catalog, enrolled courses, and the IDE.',
  },
  {
    id: 'community',
    label: 'Community',
    description: 'Ask questions, join discussions, and browse tags.',
  },
  {
    id: 'compete',
    label: 'Compete',
    description: 'Practice problems, platforms, and upcoming contests.',
  },
  {
    id: 'achievements',
    label: 'Achievements',
    description: 'Badges, leaderboard, reputation, and levels.',
  },
  {
    id: 'teach',
    label: 'Teach',
    description: 'Course management and cross-course analytics.',
  },
];

export type ShellMembership = { courseId: string; role: string; level: number };

export type ShellSessionUser = {
  systemRole?: string;
  memberships?: ShellMembership[];
};

export const appNavItems: AppNavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Track account, projects, and milestones.',
    visibility: 'all',
    placement: 'primary',
  },
  {
    href: '/projects',
    label: 'Projects',
    description: 'Manage submissions, progress, and reviews.',
    visibility: 'all',
    placement: 'primary',
    matchPrefixes: ['/submissions'],
  },
  {
    href: '/planner',
    label: 'Planner',
    description: 'Plan your academic path, track petitions, and generate a sheet.',
    visibility: 'all',
    placement: 'primary',
  },
  {
    href: '/tutor',
    label: 'Hassona',
    description: 'Chat, insights, smart routing, and recommendations.',
    visibility: 'all',
    placement: 'primary',
    matchPrefixes: ['/tutor/insights', '/tutor/routing', '/tutor/recommendations'],
  },
  {
    href: '/catalog',
    label: 'Catalog',
    description: 'Browse project templates and apply across all courses.',
    visibility: 'all',
    placement: 'learn',
  },
  {
    href: '/courses',
    label: 'My Courses',
    description: 'Your enrolled courses — lectures, assignments, and grades.',
    visibility: 'all',
    placement: 'learn',
    matchPrefixes: ['/catalog/'],
  },
  {
    href: '/ide',
    label: 'IDE',
    description: 'Run code in a sandboxed playground.',
    visibility: 'all',
    placement: 'learn',
  },
  {
    href: '/community',
    label: 'Q&A',
    description: 'Ask questions, vote, and accept answers.',
    visibility: 'all',
    placement: 'community',
    exactHref: true,
    matchPrefixes: ['/community/q'],
  },
  {
    href: '/community/discussions',
    label: 'Discussions',
    description: 'Long-form threads scoped to your enrolled courses.',
    visibility: 'all',
    placement: 'community',
  },
  {
    href: '/community/tags',
    label: 'Tags',
    description: 'Browse topics and filter questions by tag.',
    visibility: 'all',
    placement: 'community',
  },
  {
    href: '/competitions/nibras-75',
    label: 'Nibras 75',
    description: 'Curated LeetCode list — 75 essential DSA problems.',
    visibility: 'all',
    placement: 'compete',
  },
  {
    href: '/competitions/practice',
    label: 'Codeforces practice',
    description: 'Codeforces problems, tags, and rating analytics.',
    visibility: 'all',
    placement: 'compete',
    matchPrefixes: ['/competitions/codehunt'],
  },
  {
    href: '/competitions/platforms',
    label: 'Integrations',
    description: 'Connect Codeforces, LeetCode, CTF, and other platforms.',
    visibility: 'all',
    placement: 'compete',
  },
  {
    href: '/competitions',
    label: 'Contests',
    description: 'Upcoming contests, calendar, and linked accounts.',
    visibility: 'all',
    placement: 'compete',
    exactHref: true,
    matchPrefixes: ['/competitions/ranking', '/competitions/history'],
  },
  {
    href: '/achievements',
    label: 'Badges',
    description: 'Earned badges and progress toward the next milestones.',
    visibility: 'all',
    placement: 'achievements',
  },
  {
    href: '/achievements/leaderboard',
    label: 'Leaderboard',
    description: 'Compare your standing against the rest of the cohort.',
    visibility: 'all',
    placement: 'achievements',
  },
  {
    href: '/achievements/reputation',
    label: 'Reputation',
    description: 'Detailed breakdown of reputation changes over time.',
    visibility: 'all',
    placement: 'achievements',
  },
  {
    href: '/levels',
    label: 'Levels',
    description: 'Tier progression based on reputation and contributions.',
    visibility: 'all',
    placement: 'achievements',
  },
  {
    href: '/instructor',
    label: 'Instructor',
    description: 'Manage courses, templates, team formation, and programs.',
    visibility: 'instructor',
    placement: 'teach',
    matchPrefixes: ['/instructor/programs', '/instructor/courses'],
  },
  {
    href: '/instructor/analytics',
    label: 'Analytics',
    description: 'Aggregate signal across courses — submissions, pass rate, engagement.',
    visibility: 'instructor',
    placement: 'teach',
    matchPrefixes: [
      '/instructor/analytics/courses',
      '/instructor/analytics/engagement',
      '/instructor/analytics/students',
    ],
  },
  {
    href: '/admin',
    label: 'Admin',
    description: 'System-wide submissions, projects, and oversight.',
    visibility: 'admin',
    placement: 'admin',
  },
];

export function canAccessNavItem(item: AppNavItem, user: ShellSessionUser | null): boolean {
  if (item.visibility === 'all') return true;
  if (item.visibility === 'admin') return user?.systemRole === 'admin';
  return (
    user?.systemRole === 'admin' ||
    (user?.memberships?.some((membership) => {
      const role = membership.role.toLowerCase();
      return role === 'instructor' || role === 'ta';
    }) ??
      false)
  );
}

function hrefPath(href: string): string {
  return href.split('?')[0];
}

export function isNavItemActive(item: AppNavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  const base = hrefPath(item.href);

  if (pathname === base) return true;

  if (
    item.matchPrefixes?.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

  if (item.exactHref) return false;

  if (pathname.startsWith(`${base}/`)) return true;

  return false;
}

export function getVisibleNavItems(user: ShellSessionUser | null): AppNavItem[] {
  return appNavItems.filter((item) => canAccessNavItem(item, user));
}

export function getPrimaryNavItems(user: ShellSessionUser | null): AppNavItem[] {
  return getVisibleNavItems(user).filter((item) => item.placement === 'primary');
}

export function getNavItemsForGroup(
  groupId: NavGroupId,
  user: ShellSessionUser | null
): AppNavItem[] {
  return getVisibleNavItems(user).filter((item) => item.placement === groupId);
}

export function getAdminNavItem(user: ShellSessionUser | null): AppNavItem | null {
  return getVisibleNavItems(user).find((item) => item.placement === 'admin') ?? null;
}

export function isNavGroupActive(
  groupId: NavGroupId,
  items: AppNavItem[],
  pathname: string | null
): boolean {
  return items.some((item) => isNavItemActive(item, pathname));
}

export function getActiveNavItemInGroup(
  items: AppNavItem[],
  pathname: string | null
): AppNavItem | null {
  return items.find((item) => isNavItemActive(item, pathname)) ?? null;
}

export const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Track your current course operations and GitHub-linked progress.',
  },
  '/projects': {
    title: 'Projects',
    subtitle: 'Review milestones, role applications, submissions, and grading details.',
  },
  '/submissions': {
    title: 'Submissions',
    subtitle: 'Review your submission history, statuses, and detailed feedback.',
  },
  '/catalog': {
    title: 'Project Catalog',
    subtitle: 'Discover projects, browse templates, and apply.',
  },
  '/courses': {
    title: 'My Courses',
    subtitle: 'Enrolled courses — lectures, assignments, grades, and discussions.',
  },
  '/planner': {
    title: 'Planner',
    subtitle: 'Track your academic program, petitions, approvals, and printable sheet.',
  },
  '/planner/track': {
    title: 'Track Selection',
    subtitle: 'Choose the specialization track for your program plan.',
  },
  '/planner/petitions': {
    title: 'Planner Petitions',
    subtitle: 'Review academic petitions and the current approval status.',
  },
  '/planner/sheet': {
    title: 'Program Sheet',
    subtitle: 'Generate and review the printable version of your program plan.',
  },
  '/instructor': {
    title: 'Instructor',
    subtitle: 'Manage courses, templates, team formation, and student submissions.',
  },
  '/instructor/courses': {
    title: 'Courses',
    subtitle: 'Review course activity, projects, templates, and review queues.',
  },
  '/instructor/programs': {
    title: 'Programs',
    subtitle: 'Build academic programs, requirements, tracks, and petitions.',
  },
  '/admin': {
    title: 'Admin',
    subtitle: 'System-wide oversight of submissions, projects, and activity.',
  },
  '/install/complete': {
    title: 'GitHub App',
    subtitle: 'Finish linking the installation to unlock repository provisioning.',
  },
  '/instructor/onboarding': {
    title: 'CLI Setup Guide',
    subtitle: 'Install the Nibras CLI, authenticate, and submit your first project.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Manage your account preferences and connected services.',
  },
  '/achievements': {
    title: 'Badges',
    subtitle: 'Track the badges you have earned and the milestones still ahead.',
  },
  '/achievements/leaderboard': {
    title: 'Leaderboard',
    subtitle: 'Compare your standing against the rest of the cohort.',
  },
  '/achievements/reputation': {
    title: 'Reputation',
    subtitle: 'Detailed breakdown of reputation changes over time.',
  },
  '/levels': {
    title: 'Levels',
    subtitle: 'Tier progression based on reputation and contributions.',
  },
  '/tutor': {
    title: 'Hassona',
    subtitle: "Chat with Hassona about any topic you're working through.",
  },
  '/tutor/insights': {
    title: 'Learning Insights',
    subtitle: "Where you're strong, where you're struggling, and what to study next.",
  },
  '/tutor/routing': {
    title: 'Smart Routing',
    subtitle: 'Map a learning goal to a step-by-step study plan.',
  },
  '/tutor/recommendations': {
    title: 'Recommendations',
    subtitle: 'Specialization and track suggestions tailored to your grades.',
  },
  '/community': {
    title: 'Q&A',
    subtitle: 'Ask questions, share answers, and learn from your peers.',
  },
  '/community/discussions': {
    title: 'Discussions',
    subtitle: 'Long-form threads scoped to your enrolled courses.',
  },
  '/community/tags': {
    title: 'Tags',
    subtitle: 'Browse topics and filter questions by tag.',
  },
  '/competitions': {
    title: 'Contests',
    subtitle: 'Upcoming contests and linked accounts.',
  },
  '/ide': {
    title: 'IDE',
    subtitle: 'Write, run, and debug code in a sandboxed playground.',
  },
  '/competitions/practice': {
    title: 'Codeforces practice',
    subtitle: 'Codeforces problems, tags, and rating analytics.',
  },
  '/competitions/nibras-75': {
    title: 'Nibras 75',
    subtitle: 'Curated LeetCode interview list — 75 essential DSA problems.',
  },
  '/competitions/ranking': {
    title: 'Ranking',
    subtitle: 'How you rank across linked competitive platforms.',
  },
  '/competitions/history': {
    title: 'Contest History',
    subtitle: 'Your past contest performance and rating trend.',
  },
  '/competitions/platforms': {
    title: 'Integrations',
    subtitle: 'Connect contests, CTF events, Kaggle, bug bounty, and more.',
  },
  '/instructor/analytics': {
    title: 'Analytics',
    subtitle: 'Aggregate cross-course signal and risk callouts.',
  },
  '/instructor/analytics/courses': {
    title: 'Course Analytics',
    subtitle: 'Per-course completion, average grade, and pass rate.',
  },
  '/instructor/analytics/engagement': {
    title: 'Engagement',
    subtitle: 'Time-on-task broken down by day and course.',
  },
  '/instructor/analytics/students': {
    title: 'Students',
    subtitle: 'Per-student engagement, grades, and risk classification.',
  },
};

export function getPageTitle(pathname: string | null): { title: string; subtitle: string } | null {
  if (!pathname) return null;
  const matches = Object.entries(pageTitles)
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((left, right) => right[0].length - left[0].length);
  return matches[0]?.[1] ?? null;
}
