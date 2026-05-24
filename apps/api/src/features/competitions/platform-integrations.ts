export type PlatformIntegrationCategory =
  | 'competitive_programming'
  | 'ai_ml'
  | 'bug_bounty'
  | 'open_source'
  | 'math_olympiad'
  | 'ctf';

export type PlatformIntegrationStatus = 'live' | 'beta' | 'coming_soon';

export type PlatformIntegration = {
  id: string;
  name: string;
  category: PlatformIntegrationCategory;
  status: PlatformIntegrationStatus;
  description: string;
  externalUrl: string;
  linkHost?: string;
  href?: string;
};

export const PLATFORM_CATEGORIES: Record<
  PlatformIntegrationCategory,
  { label: string; description: string }
> = {
  competitive_programming: {
    label: 'Competitive programming',
    description: 'Contests and practice across major CP platforms.',
  },
  ai_ml: {
    label: 'AI / ML',
    description: 'Kaggle and data science competitions.',
  },
  bug_bounty: {
    label: 'Bug bounty',
    description: 'Track bounties and reputation from security programs.',
  },
  open_source: {
    label: 'Open source',
    description: 'GitHub achievements and contribution badges on your profile.',
  },
  math_olympiad: {
    label: 'Math / Olympiad',
    description: 'Problem syncing from math and olympiad platforms.',
  },
  ctf: {
    label: 'CTF & security',
    description: 'Capture-the-flag events, labs, and training rooms.',
  },
};

export const PLATFORM_INTEGRATIONS: PlatformIntegration[] = [
  {
    id: 'codeforces',
    name: 'Codeforces',
    category: 'competitive_programming',
    status: 'live',
    description: 'Contests, practice problemset, and submission analytics.',
    externalUrl: 'https://codeforces.com',
    linkHost: 'codeforces',
    href: '/competitions/practice?tab=codeforces',
  },
  {
    id: 'leetcode',
    name: 'LeetCode',
    category: 'competitive_programming',
    status: 'live',
    description: 'Nibras 75 curated list with LeetCode progress sync.',
    externalUrl: 'https://leetcode.com',
    linkHost: 'leetcode',
    href: '/competitions/nibras-75',
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    category: 'competitive_programming',
    status: 'live',
    description: 'Upcoming contests synced to the Nibras calendar.',
    externalUrl: 'https://atcoder.jp',
    linkHost: 'atcoder',
    href: '/competitions',
  },
  {
    id: 'kaggle',
    name: 'Kaggle',
    category: 'ai_ml',
    status: 'beta',
    description: 'Competition calendar and notebook submissions (integration in progress).',
    externalUrl: 'https://www.kaggle.com/competitions',
    linkHost: 'kaggle',
    href: '/competitions/platforms#kaggle',
  },
  {
    id: 'hackerone',
    name: 'HackerOne',
    category: 'bug_bounty',
    status: 'coming_soon',
    description: 'Track submitted reports, bounties, and reputation.',
    externalUrl: 'https://www.hackerone.com',
    linkHost: 'hackerone',
  },
  {
    id: 'bugcrowd',
    name: 'Bugcrowd',
    category: 'bug_bounty',
    status: 'coming_soon',
    description: 'Aggregate bounty programs and submission status.',
    externalUrl: 'https://www.bugcrowd.com',
    linkHost: 'bugcrowd',
  },
  {
    id: 'github_achievements',
    name: 'GitHub Achievements',
    category: 'open_source',
    status: 'beta',
    description: 'Pull Shark, Starstruck, and other badges embedded in your Nibras profile.',
    externalUrl: 'https://github.com',
    href: '/competitions/platforms#open-source',
  },
  {
    id: 'project_euler',
    name: 'Project Euler',
    category: 'math_olympiad',
    status: 'coming_soon',
    description: 'Sync solved problems and progress from Project Euler.',
    externalUrl: 'https://projecteuler.net',
    linkHost: 'project_euler',
  },
  {
    id: 'aops',
    name: 'Art of Problem Solving',
    category: 'math_olympiad',
    status: 'coming_soon',
    description: 'Community problem progress and contest history.',
    externalUrl: 'https://artofproblemsolving.com',
  },
  {
    id: 'brilliant',
    name: 'Brilliant',
    category: 'math_olympiad',
    status: 'coming_soon',
    description: 'Course and puzzle progress for math tracks.',
    externalUrl: 'https://brilliant.org',
  },
  {
    id: 'ctftime',
    name: 'CTFtime',
    category: 'ctf',
    status: 'live',
    description: 'Upcoming CTF events and team rankings synced to your calendar.',
    externalUrl: 'https://ctftime.org',
    linkHost: 'ctftime',
    href: '/competitions',
  },
  {
    id: 'hackthebox',
    name: 'Hack The Box',
    category: 'ctf',
    status: 'beta',
    description: 'Machine and challenge tracking with user profile stats.',
    externalUrl: 'https://www.hackthebox.com',
    linkHost: 'hackthebox',
  },
  {
    id: 'tryhackme',
    name: 'TryHackMe',
    category: 'ctf',
    status: 'beta',
    description: 'Room progress, badges, and learning paths.',
    externalUrl: 'https://tryhackme.com',
    linkHost: 'tryhackme',
  },
  {
    id: 'picoctf',
    name: 'picoCTF',
    category: 'ctf',
    status: 'coming_soon',
    description: 'Annual picoCTF challenges and scoreboard sync.',
    externalUrl: 'https://picoctf.org',
    linkHost: 'picoctf',
  },
  {
    id: 'defcon',
    name: 'DEF CON CTF Quals',
    category: 'ctf',
    status: 'coming_soon',
    description: 'Qualifier events and team standings.',
    externalUrl: 'https://ctf.defcon.org',
    linkHost: 'defcon',
  },
];
