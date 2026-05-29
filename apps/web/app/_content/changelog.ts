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
    date: 'May 29, 2026',
    version: 'v2.0.1',
    title: 'Platform 2.0 — catalog LMS, community, profiles, gamification, and auth',
    categories: [
      {
        type: 'features',
        items: [
          {
            text: 'Catalog LMS — lecture player, assignments, MCQ and quiz types, and course video tracking',
            author: 'EpitomeZied',
          },
          {
            text: 'Catalog tabs — browse Courses and Projects on one page with course-scoped project filtering',
            author: 'EpitomeZied',
          },
          {
            text: 'Course discovery and enrollment — join public courses and request access to private courses from the catalog',
            author: 'EpitomeZied',
          },
          {
            text: 'Instructor enrollment requests — approve or reject pending access on the course Members page',
            author: 'EpitomeZied',
          },
          {
            text: 'Community v2 — voting, reputation hooks, moderation, bookmarks, public read-only discussions, and author profile links',
            author: 'EpitomeZied',
          },
          {
            text: 'Competitions calendar — week and day views with contest duration helpers',
            author: 'EpitomeZied',
          },
          {
            text: 'Gamification v2 — badge categories, rating titles, and reputation level tiers',
            author: 'EpitomeZied',
          },
          {
            text: 'Achievements page — category-filtered badge catalog, reputation stats, unlock banner, and Codeforces/LeetCode rating badge groups',
            author: 'EpitomeZied',
          },
          {
            text: 'Public user profiles — scoped pages with social links, streak and competition sections, badge modal, and reputation timeline',
            author: 'EpitomeZied',
          },
          {
            text: 'CLI 2.0 — modern TypeScript CLI with device login and improved project workflows',
            author: 'EpitomeZied',
          },
          {
            text: 'Sign-in — GitHub, magic link, or email/password with set/reset password, security settings, and session bridge to the API',
            author: 'EpitomeZied',
          },
          {
            text: 'Daily problem — streak tracking, assignments, and dedicated database tables for daily practice',
            author: 'EpitomeZied',
          },
          {
            text: 'Documentation — Introduction, FAQ, and Getting Started as separate pages under /docs',
            author: 'EpitomeZied',
          },
        ],
      },
      {
        type: 'improvements',
        items: [
          {
            text: 'Landing layout — tighter section spacing and aligned wide/terminal column widths on desktop',
            author: 'EpitomeZied',
          },
          {
            text: 'Sign-in — web login consolidated to /sign-in with terminal-style GitHub and magic-link UI; landing uses sign-in CTAs only',
            author: 'EpitomeZied',
          },
          {
            text: 'Landing and global URLs — canonical web base URL across marketing and app surfaces',
            author: 'EpitomeZied',
          },
          {
            text: 'Azure Container Apps deploy — automated builds and OIDC-based production rollout',
            author: 'EpitomeZied',
          },
          {
            text: 'Removed VJudge integration — competitions use native calendar and platform fetchers',
            author: 'EpitomeZied',
          },
          {
            text: 'Achievements dashboard API — faster load with throttled reputation sync, single metrics pass, and targeted rank queries',
            author: 'EpitomeZied',
          },
          {
            text: 'Landing CLI section — headline keeps “Terminal-native” on one line',
            author: 'EpitomeZied',
          },
          {
            text: 'CLI showcase tiles — submit, status, workflow, and result previews on the marketing page',
            author: 'EpitomeZied',
          },
          {
            text: 'Profile navigation — /users redirects to your profile; account menu Profile link; anchor nav between profile sections',
            author: 'EpitomeZied',
          },
          {
            text: 'Copy profile link — shareable URL action on your own profile header',
            author: 'EpitomeZied',
          },
          {
            text: 'Profile visibility — course progress and submissions visible only to self, instructors, and admins',
            author: 'EpitomeZied',
          },
          {
            text: 'Reputation history — clearer event labels with project, question, and streak context',
            author: 'EpitomeZied',
          },
        ],
      },
      {
        type: 'bugFixes',
        items: [
          {
            text: 'Web auth — production redirect origins, session bridge via /auth/complete, and real sign-out',
            author: 'EpitomeZied',
          },
          {
            text: 'CLI device flow — verification links point to /device instead of legacy /dev/approve',
            author: 'EpitomeZied',
          },
          {
            text: 'Web production build — Prettier and ProfileHeader type fixes for CI Docker image builds',
            author: 'EpitomeZied',
          },
        ],
      },
    ],
  },
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
