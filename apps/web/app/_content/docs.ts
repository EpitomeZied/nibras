export type DocsCapability = {
  title: string;
  description: string;
};

export type DocsFaqItem = {
  question: string;
  answer: string;
};

export type DocsGettingStartedStep = {
  title: string;
  description: string;
  link?: { href: string; label: string };
};

export const docsNavSections = [
  { href: '/docs', label: 'Overview' },
  { href: '/docs/introduction', label: 'Introduction' },
  { href: '/docs/faq', label: 'FAQ' },
  { href: '/docs/getting-started', label: 'Getting Started' },
] as const;

export const docsHub = {
  title: 'Documentation',
  subtitle:
    'Learn what Nibras is for, find answers to common questions, and follow the steps to get started on the web and CLI.',
} as const;

export const docsIntro = {
  whyUse: {
    title: 'Why use Nibras?',
    paragraphs: [
      'Nibras is a course operations platform built for computer science education. It connects GitHub-native project delivery with a web dashboard so students, instructors, and operators work from one system instead of scattered spreadsheets, LMS tabs, and ad-hoc scripts.',
      'Students get a clear path from setup to submission. Instructors get visibility into progress, review queues, and course analytics. Everyone shares the same source of truth for deadlines, grades, and reputation.',
    ],
    highlights: [
      'One GitHub login — no separate passwords for the platform',
      'Terminal submissions with live verification feedback',
      'My Courses, planning, tutoring, and practice in one dashboard',
      'Free during early access',
    ],
  },
  whatCanYouDo: {
    title: 'What can you do?',
    items: [
      {
        title: 'Students',
        description:
          'Enroll in courses, watch lectures, submit assignments, run projects via the CLI, practice in the IDE, compete on Nibras 75, earn badges, and chat with Hassona — all from one workspace.',
      },
      {
        title: 'Instructors',
        description:
          'Create courses and projects, manage teams and milestones, review submissions in-app, export results, and monitor analytics across courses and students.',
      },
      {
        title: 'Course operations',
        description:
          'Track program requirements, planner tracks and petitions, community Q&A, discussions, notifications, and submission pipelines without switching tools.',
      },
    ] satisfies DocsCapability[],
  },
};

export const docsFaq: DocsFaqItem[] = [
  {
    question: 'Do I need a GitHub account?',
    answer:
      'For the web dashboard you can sign in with a magic link sent to your email. GitHub is required for CLI submissions and pushing project work — connect GitHub from the dashboard or sign in with GitHub on the landing page.',
  },
  {
    question: 'I signed in with a magic link — can I use the CLI?',
    answer:
      'Not until GitHub is linked. Install the CLI, run nibras login, and complete GitHub device authorization. Magic-link sign-in only establishes your web session.',
  },
  {
    question: 'Is Nibras only for the command line?',
    answer:
      'No. The web dashboard covers My Courses (lectures, assignments, grades), planning, community, competitions, and instructor review. The CLI is the primary path for coding projects and automated verification.',
  },
  {
    question: 'What if the GitHub App is not installed?',
    answer:
      'Run nibras ping in the terminal or follow your instructor’s invite link. The GitHub App must be installed on your account before submissions can push to course repositories.',
  },
  {
    question: 'Can I submit work multiple times?',
    answer:
      'Yes. Each nibras submit creates a new submission. The most recent verified submission typically counts toward grading. Avoid rapid repeated submits — rate limits may apply.',
  },
  {
    question: 'Local tests pass but the server says they failed — why?',
    answer:
      'The server runs tests in a clean sandbox. Common causes: hardcoded absolute paths, files outside the allowed set in .nibras/project.json, or missing dependencies that were not committed.',
  },
  {
    question: 'How do I switch between multiple courses?',
    answer:
      'Use the web dashboard to move between enrolled courses. In the CLI, use the correct project key with the course prefix (for example cs161/lab1 vs cs202/hw3).',
  },
  {
    question: 'Where are CLI session tokens stored?',
    answer:
      'macOS: ~/Library/Application Support/nibras/config.json. Linux: ~/.config/nibras/config.json. Windows: %APPDATA%\\nibras\\config.json. Run nibras logout or delete the file to clear saved sessions.',
  },
  {
    question: 'Who do I contact for help?',
    answer:
      'For course keys, due dates, or enrollment, contact your instructor. For CLI diagnostics, run nibras ping and share the output. Platform issues can be reported on the Nibras GitHub repository.',
  },
];

export const docsFaqHelp = {
  title: 'Need More Help?',
  lines: ['Have a question? Found a bug? Want a new feature?', 'Open an issue on GitHub'],
  issueUrl: 'https://github.com/nibras-platform/nibras/issues',
} as const;

export const docsGettingStarted: DocsGettingStartedStep[] = [
  {
    title: '1. Sign in with GitHub',
    description:
      'Open the landing page and choose Get started free or Sign in. Complete GitHub OAuth once — your session works across the dashboard and CLI device flow.',
    link: { href: '/', label: 'Go to sign in' },
  },
  {
    title: '2. Explore your dashboard',
    description:
      'After sign-in you land on the dashboard. Open My Courses for lectures and assignments, Projects for course work, Planner for program tracks, and Community for Q&A and discussions.',
    link: { href: '/dashboard', label: 'Open dashboard' },
  },
  {
    title: '3. Join a course',
    description:
      'Use an invite link from your instructor or enroll from a public course listing. Confirm you see the course under My Courses before starting assignments.',
    link: { href: '/courses', label: 'View My Courses' },
  },
  {
    title: '4. Install and log in to the CLI',
    description:
      'Install the @nibras/cli package globally, then run nibras login and approve the device code in your browser. Node.js 18+ and git are required.',
    link: { href: '/instructor/onboarding', label: 'CLI setup guide' },
  },
  {
    title: '5. Set up and submit a project',
    description:
      'In your project directory run nibras setup with the key your instructor provides, work locally, run nibras test, then nibras submit. Track status on the web dashboard.',
  },
  {
    title: '6. Use course content on the web',
    description:
      'From a course hub you can watch embedded lectures, submit assignments, check grades, browse published projects, and join course discussions — without leaving the browser.',
    link: { href: '/catalog?tab=courses', label: 'Course catalog' },
  },
];
