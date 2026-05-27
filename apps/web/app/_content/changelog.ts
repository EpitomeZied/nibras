export type ChangelogCategory = 'features' | 'improvements' | 'bugFixes';

export type ChangelogItem = {
  text: string;
  author?: string;
};

export type ChangelogCategoryGroup = {
  type: ChangelogCategory;
  items: ChangelogItem[];
};

export type ChangelogRelease = {
  date: string;
  version: string;
  title: string;
  categories: ChangelogCategoryGroup[];
};

export const changelogCategoryMeta: Record<ChangelogCategory, { label: string; icon: string }> = {
  features: { label: 'FEATURES', icon: '🚀' },
  improvements: { label: 'IMPROVEMENTS', icon: '🔧' },
  bugFixes: { label: 'BUG FIXES', icon: '🐛' },
};

export const changelogReleases: ChangelogRelease[] = [
  {
    date: 'May 27, 2026',
    version: 'Early access',
    title: 'My Courses hub, smart dashboard, and expanded badges',
    categories: [
      {
        type: 'features',
        items: [
          {
            text: 'My Courses — videos, assignments, and grades in one enrolled-course hub',
            author: 'EpitomeZied',
          },
          {
            text: 'Smart dashboard — overall stats, upcoming deadlines, and course snapshots',
            author: 'EpitomeZied',
          },
          {
            text: 'Expanded badges — richer catalog, reputation breakdown, and level tiers',
            author: 'EpitomeZied',
          },
        ],
      },
      {
        type: 'improvements',
        items: [
          {
            text: 'Public changelog and documentation pages on the marketing site',
            author: 'EpitomeZied',
          },
        ],
      },
    ],
  },
  {
    date: 'Platform release',
    version: 'v1.0.2',
    title: 'AI integrations, community, and gamification',
    categories: [
      {
        type: 'features',
        items: [
          {
            text: 'AI integration suite — multi-provider support with personal credential management',
            author: 'EpitomeZied',
          },
          {
            text: 'Reputation and aura system — linked account sync and competitive leaderboards',
            author: 'EpitomeZied',
          },
          {
            text: 'Dual-mode onboarding — role-based flows for instructors and students',
            author: 'EpitomeZied',
          },
          {
            text: 'Community features — tag management, Q&A moderation, and content curation',
            author: 'EpitomeZied',
          },
          {
            text: 'Enhanced course access — public visibility, enrollment workflows, and role-based controls',
            author: 'EpitomeZied',
          },
          {
            text: 'Gamification expansion — badge catalog, points system, and account verification',
            author: 'EpitomeZied',
          },
        ],
      },
      {
        type: 'improvements',
        items: [
          {
            text: 'CLI improvements — cleaner integration and streamlined setup experience',
            author: 'EpitomeZied',
          },
          {
            text: 'Avatar and profile sync — GitHub integration for profile updates',
            author: 'EpitomeZied',
          },
        ],
      },
    ],
  },
];
