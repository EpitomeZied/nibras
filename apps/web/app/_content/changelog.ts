export type ChangelogRelease = {
  version: string;
  date: string;
  summary?: string;
  items: string[];
};

export const changelogReleases: ChangelogRelease[] = [
  {
    version: 'Early access',
    date: 'May 2026',
    summary: 'Latest web dashboard and student experience updates.',
    items: [
      'My Courses — videos, assignments, and grades in one enrolled-course hub',
      'Smart dashboard — overall stats, upcoming deadlines, and course snapshots',
      'Expanded badges — richer catalog, reputation breakdown, and level tiers',
    ],
  },
  {
    version: 'v1.0.2',
    date: 'Platform release',
    summary: 'Major platform capabilities across courses, community, and CLI.',
    items: [
      'AI integration suite — multi-provider support with personal credential management',
      'Reputation and aura system — linked account sync and competitive leaderboards',
      'Dual-mode onboarding — role-based flows for instructors and students',
      'Community features — tag management, Q&A moderation, and content curation',
      'Enhanced course access — public visibility, enrollment workflows, and role-based controls',
      'Gamification expansion — badge catalog, points system, and account verification',
      'CLI improvements — cleaner integration and streamlined setup experience',
      'Avatar and profile sync — GitHub integration for profile updates',
    ],
  },
];
