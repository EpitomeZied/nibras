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
    title: 'Achievements profile view, auth improvements, and docs refresh',
    categories: [
      {
        type: 'features',
        items: [
          {
            text: 'Achievements page — full self-profile layout with course progress, submissions, badge catalog, and reputation history',
            author: 'EpitomeZied',
          },
          {
            text: 'Public user profiles — social links, streak and competition sections, badge modal, and reputation timeline',
            author: 'EpitomeZied',
          },
          {
            text: 'Email password sign-in — set password for magic-link accounts, reset password flow, and security settings tab',
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
        ],
      },
      {
        type: 'bugFixes',
        items: [
          {
            text: 'Web production build — Prettier and ProfileHeader type fixes for CI Docker image builds',
            author: 'EpitomeZied',
          },
        ],
      },
    ],
  },
  {
    date: 'May 29, 2026',
    version: 'v2.0.0',
    title: 'Catalog LMS, community v2, gamification, and platform hardening',
    categories: [
      {
        type: 'features',
        items: [
          {
            text: 'Catalog LMS — lecture player, assignments, MCQ and quiz types, and course video tracking',
            author: 'EpitomeZied',
          },
          {
            text: 'Community v2 — voting, reputation hooks, moderation, bookmarks, and public read-only discussions',
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
            text: 'User profiles — scoped public profile pages with course progress and submissions',
            author: 'EpitomeZied',
          },
          {
            text: 'CLI 2.0 — modern TypeScript CLI with device login and improved project workflows',
            author: 'EpitomeZied',
          },
          {
            text: 'GitHub sign-in — Continue with GitHub on /sign-in and /connect via Better Auth',
            author: 'EpitomeZied',
          },
          {
            text: 'Email magic link sign-in — passwordless dashboard access with session bridge to the API',
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
