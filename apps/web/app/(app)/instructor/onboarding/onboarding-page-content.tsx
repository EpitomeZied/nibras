'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CliSetupGuideControls, {
  type CliGuideViewMode,
} from '../../../_components/cli-setup-guide-controls';
import CliCodeBlock from '../../_components/cli-code-block';
import TerminalMockup, { type TerminalLine } from '../../_components/terminal-mockup';
import { useSession, getShellUserIdentity } from '../../_components/session-context';
import { apiFetch } from '../../../lib/session';
import { useFetch } from '../../../lib/use-fetch';
import { prefs } from '../../../lib/prefs';
import {
  buildHostedLoginCommand,
  buildStudentEmailBody,
  buildStudentQuickStart,
  discoverOnboardingApiBaseUrl,
  getInstallCommand,
  getInstallTroubleshootingCommand,
  getOnboardingConfigPath,
  getOnboardingDirExample,
  getUnixInstallCommand,
  getWindowsInstallCommand,
  NPM_INSTALL_COMMAND,
  ONBOARDING_STEP_VIDEOS,
  PINNED_RELEASE_TAG,
} from './onboarding-content.js';
import styles from './page.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────
type OS = 'mac' | 'linux' | 'windows';
type WindowsShell = 'powershell' | 'gitbash';
type CompletionState = Record<string, boolean>;
type ViewMode = CliGuideViewMode;

type CommandReferenceItem = {
  command: string;
  description: string;
  note?: string;
};

type CommandReferenceGroup = {
  title: string;
  items: CommandReferenceItem[];
};

type InstructorCourse = {
  id: string;
  slug: string;
  title: string;
  courseCode: string;
};

type InstructorProject = {
  id: string;
  projectKey: string;
  title: string;
  status: string;
};

export type OnboardingPageProps = {
  defaultViewMode?: ViewMode;
  basePath?: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const COMPLETION_KEY = 'nibras.onboarding.completion';
const TOTAL_STEPS_INSTRUCTOR = 10;
const TOTAL_STEPS_STUDENT = 9;
const DEFAULT_PROJECT_KEY = 'cs101/assignment-1';

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'mac';
  const p = navigator.platform?.toLowerCase() ?? '';
  const ua = navigator.userAgent?.toLowerCase() ?? '';
  if (p.includes('win') || ua.includes('windows')) return 'windows';
  if (p.includes('linux') || ua.includes('linux')) return 'linux';
  return 'mac';
}

function loadCompletion(userId?: string): CompletionState {
  if (typeof window === 'undefined') return {};
  try {
    const key = userId ? `${COMPLETION_KEY}:${userId}` : COMPLETION_KEY;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CompletionState) : {};
  } catch {
    return {};
  }
}

function saveCompletion(state: CompletionState, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? `${COMPLETION_KEY}:${userId}` : COMPLETION_KEY;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

// ── OS-aware code block ───────────────────────────────────────────────────────
function OsCode({
  os,
  mac,
  linux,
  windows,
}: {
  os: OS;
  mac: string;
  linux?: string;
  windows?: string;
}) {
  const code = os === 'windows' ? (windows ?? mac) : os === 'linux' ? (linux ?? mac) : mac;
  return <CliCodeBlock code={code} />;
}

// ── Per-OS install commands ───────────────────────────────────────────────────
const NODE_INSTALL_MAC = `# Recommended — nvm (no sudo, no permission issues)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc          # zsh default on macOS 10.15+ — use ~/.bashrc for bash
nvm install --lts
nvm use --lts
nvm alias default node

# Alternative — Homebrew
# brew install node`;

const NODE_INSTALL_LINUX = `# Recommended — nvm (no sudo, no permission issues)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc         # or ~/.zshrc if you use zsh
nvm install --lts
nvm use --lts
nvm alias default node

# Alternative — apt (Ubuntu/Debian)
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt-get install -y nodejs`;

const NODE_INSTALL_WINDOWS = `# Option A — winget (Windows 10 1709+ / Windows 11)
winget install OpenJS.NodeJS.LTS

# Option B — download the official .msi from nodejs.org
# (includes npm, adds Node.js to PATH automatically)

# After installing, open a NEW terminal to reload PATH.`;

const GIT_INSTALL_MAC = `# Xcode Command Line Tools (built-in to macOS)
xcode-select --install

# Or via Homebrew:
# brew install git`;

const GIT_INSTALL_LINUX = `# Debian / Ubuntu
sudo apt-get install -y git

# Fedora / RHEL
# sudo dnf install -y git

# Arch Linux
# sudo pacman -S git`;

const GIT_INSTALL_WINDOWS = `# Via winget
winget install Git.Git

# Or download the installer from git-scm.com/download/win
# During setup, select:
#   "Git from the command line and also from 3rd-party software"`;

const VERIFY_PREREQS = `node --version   # must be v18.x or higher
npm --version    # must be 9.x or higher
git --version`;

// ── Terminal outputs ──────────────────────────────────────────────────────────
function buildSetupOutput(projectKey: string, githubLogin: string): TerminalLine[] {
  const repoSlug = projectKey.split('/')[0] ?? 'cs101';
  return [
    { type: 'cmd', text: `nibras setup --project ${projectKey}` },
    { type: 'blank' },
    { type: 'muted', text: `  ⠋ Setting up project ${projectKey}…` },
    { type: 'muted', text: '  ⠋ Writing project manifest…' },
    { type: 'success', text: '  ✓ Project set up' },
    { type: 'blank' },
    { type: 'success', text: '╭────────────────────────────────────────────╮' },
    { type: 'success', text: `│  ✓  Project ready: ${projectKey.padEnd(24)} │` },
    { type: 'muted', text: `│  Project: ${projectKey.padEnd(28)} │` },
    {
      type: 'muted',
      text: `│  Repo:    nibras-platform/${repoSlug}-${githubLogin.slice(0, 8).padEnd(8)} │`,
    },
    { type: 'muted', text: '│  Next steps:                               │' },
    { type: 'muted', text: '│    nibras task    — view task instructions │' },
    { type: 'muted', text: '│    nibras test    — run local tests        │' },
    { type: 'muted', text: '│    nibras submit  — submit your solution   │' },
    { type: 'success', text: '╰────────────────────────────────────────────╯' },
  ];
}

const submitOutput: TerminalLine[] = [
  { type: 'cmd', text: 'nibras submit' },
  { type: 'blank' },
  { type: 'muted', text: '  Running tests: npm test' },
  { type: 'blank' },
  { type: 'success', text: '  ✓ Staged 3 files' },
  { type: 'success', text: '  ✓ Pushed commit a3f7c1d' },
  { type: 'output', text: '  Verifying  ████████████████░░░░  80%' },
  { type: 'blank' },
  { type: 'success', text: '╭──────────────────────────────╮' },
  { type: 'success', text: '│  ✓  Submission passed        │' },
  { type: 'muted', text: '│  Status:  passed             │' },
  { type: 'success', text: '╰──────────────────────────────╯' },
];

// ── Steps ─────────────────────────────────────────────────────────────────────
const ALL_STEPS = [
  {
    id: 'step-01',
    number: '01',
    label: 'Prerequisites',
    studentVisible: true,
    instructorVisible: true,
  },
  {
    id: 'step-02',
    number: '02',
    label: 'Install the CLI',
    studentVisible: true,
    instructorVisible: true,
  },
  {
    id: 'step-03',
    number: '03',
    label: 'Authenticate',
    studentVisible: true,
    instructorVisible: true,
  },
  {
    id: 'step-04',
    number: '04',
    label: 'Create a course',
    studentVisible: false,
    instructorVisible: true,
  },
  {
    id: 'step-join',
    number: '—',
    label: 'Join a course',
    studentVisible: true,
    instructorVisible: false,
  },
  {
    id: 'step-05',
    number: '05',
    label: 'Set up a project',
    studentVisible: true,
    instructorVisible: true,
  },
  {
    id: 'step-06',
    number: '06',
    label: 'Run tests',
    studentVisible: true,
    instructorVisible: true,
  },
  { id: 'step-07', number: '07', label: 'Submit', studentVisible: true, instructorVisible: true },
  {
    id: 'step-08',
    number: '08',
    label: 'Check status',
    studentVisible: true,
    instructorVisible: true,
  },
  {
    id: 'step-09',
    number: '09',
    label: 'Share with students',
    studentVisible: false,
    instructorVisible: true,
  },
  {
    id: 'step-10',
    number: '10',
    label: 'Troubleshooting',
    studentVisible: true,
    instructorVisible: true,
  },
];

function getSteps(mode: ViewMode) {
  const filtered = ALL_STEPS.filter((step) =>
    mode === 'instructor' ? step.instructorVisible : step.studentVisible
  );
  if (mode === 'instructor') return filtered;
  return filtered.map((step, index) => ({
    ...step,
    number: String(index + 1).padStart(2, '0'),
  }));
}

/** YouTube walkthroughs embedded in setup steps (16:9, up to 1080px wide). */
const STEP_VIDEOS = ONBOARDING_STEP_VIDEOS;

function stepNumber(stepId: string, mode: ViewMode): string {
  return getSteps(mode).find((s) => s.id === stepId)?.number ?? '—';
}

const COMMAND_REFERENCE_STUDENT_HIDDEN = new Set(['Advanced / compatibility']);

// ── Command reference ─────────────────────────────────────────────────────────
const COMMAND_REFERENCE_GROUPS: CommandReferenceGroup[] = [
  {
    title: 'Core workflow',
    items: [
      {
        command: 'nibras login --api-base-url <api-url>',
        description: 'Start hosted device login against a specific Nibras deployment.',
        note: 'Use the explicit API URL for hosted onboarding. The CLI default remains the local dev API.',
      },
      {
        command: 'nibras setup --project <key>',
        description: 'Bootstrap or refresh a local project.',
      },
      {
        command: 'nibras task',
        description: 'Print cached task text or fetch it if missing.',
      },
      { command: 'nibras test', description: 'Run the manifest test command.' },
      {
        command: 'nibras submit',
        description: 'Test, stage allowed files, commit, push, and wait for verification.',
      },
    ],
  },
  {
    title: 'Discovery',
    items: [
      {
        command: 'nibras list',
        description: 'List all enrolled courses and their projects.',
      },
      {
        command: 'nibras status',
        description: 'Show recent submission statuses.',
      },
      {
        command: 'nibras milestones',
        description: 'List milestones for the current or given project.',
      },
      {
        command: 'nibras config',
        description: 'View or update CLI configuration.',
      },
      {
        command: 'nibras doctor',
        description: 'Check local tooling and API connectivity.',
      },
    ],
  },
  {
    title: 'Session and diagnostics',
    items: [
      {
        command: 'nibras whoami',
        description: 'Show the signed-in user and linked GitHub account.',
      },
      {
        command: 'nibras ping',
        description: 'Show API, auth, GitHub, GitHub App, and project status.',
        note: 'Inside a project, it also reports the project key and origin remote.',
      },
      { command: 'nibras logout', description: 'Clear the local session.' },
    ],
  },
  {
    title: 'Install lifecycle',
    items: [
      {
        command: 'nibras update --version <tag>',
        description: 'Reinstall a pinned published CLI release.',
        note: 'Use `nibras update --check` to compare the installed CLI against the latest GitHub release.',
      },
      {
        command: 'nibras update --force --version <tag>',
        description: 'Force reinstall the same pinned tag.',
      },
      {
        command: 'nibras uninstall',
        description: 'Remove the global CLI install and keep local config.',
      },
    ],
  },
  {
    title: 'Advanced / compatibility',
    items: [
      {
        command: 'nibras update-buildpack --node <version>',
        description: 'Edit the Node buildpack version in .nibras/project.json.',
        note: 'Advanced manifest maintenance only; standard students usually do not need this.',
      },
      {
        command: 'nibras legacy ...',
        description: 'Run the older CLI entrypoint for compatibility.',
        note: 'Compatibility-only. It is not part of the hosted default workflow.',
      },
    ],
  },
];

// ── MarkCompleteBar ───────────────────────────────────────────────────────────
function MarkCompleteBar({ completed, onToggle }: { completed: boolean; onToggle: () => void }) {
  return (
    <div className={styles.markCompleteBar}>
      <button
        className={`${styles.markCompleteBtn} ${completed ? styles.markCompleteBtnDone : ''}`}
        onClick={onToggle}
        aria-pressed={completed}
        type="button"
      >
        {completed ? (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M1.5 6.5l3 3 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Step completed
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <rect
                x="1.5"
                y="1.5"
                width="9"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            Mark as complete
          </>
        )}
      </button>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({
  id,
  number,
  title,
  children,
  completed = false,
  onToggleComplete,
  defaultOpen = true,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
  completed?: boolean;
  onToggleComplete?: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className={styles.section}>
      <button
        className={styles.sectionHeader}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className={`${styles.stepBadge} ${completed ? styles.stepBadgeDone : ''}`}>
          {completed ? (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path
                d="M2 7l3 3 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            number
          )}
        </div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className={styles.sectionBody}>
          {children}
          {onToggleComplete && (
            <MarkCompleteBar completed={completed} onToggle={onToggleComplete} />
          )}
        </div>
      )}
    </section>
  );
}

// ── CheckItem ─────────────────────────────────────────────────────────────────
function CheckItem({ label }: { label: React.ReactNode }) {
  return (
    <div className={styles.checkItem}>
      <span className={styles.checkIcon}>○</span>
      <span>{label}</span>
    </div>
  );
}

// ── OS Tab bar ────────────────────────────────────────────────────────────────
function OsTabs({ os, setOs }: { os: OS; setOs: (v: OS) => void }) {
  const tabs: { value: OS; label: string; icon: string }[] = [
    { value: 'mac', label: 'macOS', icon: '' },
    { value: 'linux', label: 'Linux', icon: '🐧' },
    { value: 'windows', label: 'Windows', icon: '⊞' },
  ];
  return (
    <div className={styles.osTabs}>
      {tabs.map((t) => (
        <button
          key={t.value}
          className={`${styles.osTab} ${os === t.value ? styles.osTabActive : ''}`}
          onClick={() => setOs(t.value)}
        >
          {t.icon && <span className={styles.osTabIcon}>{t.icon}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Windows Shell Tabs ────────────────────────────────────────────────────────
function WindowsShellTabs({
  shell,
  setShell,
}: {
  shell: WindowsShell;
  setShell: (value: WindowsShell) => void;
}) {
  return (
    <div className={styles.osTabs}>
      {(['powershell', 'gitbash'] as WindowsShell[]).map((v) => (
        <button
          key={v}
          className={`${styles.osTab} ${shell === v ? styles.osTabActive : ''}`}
          onClick={() => setShell(v)}
          type="button"
        >
          {v === 'powershell' ? 'PowerShell' : 'Git Bash'}
        </button>
      ))}
    </div>
  );
}

function WindowsQuickStart({
  shell,
  setShell,
}: {
  shell: WindowsShell;
  setShell: (value: WindowsShell) => void;
}) {
  const shellLabel = shell === 'powershell' ? 'PowerShell' : 'Git Bash';

  return (
    <div className={styles.windowsGuide}>
      <div className={styles.windowsGuideHeader}>
        <div>
          <p className={styles.windowsGuideEyebrow}>Recommended For Windows</p>
          <h3 className={styles.windowsGuideTitle}>Use one shell and keep using it</h3>
        </div>
        <WindowsShellTabs shell={shell} setShell={setShell} />
      </div>
      <ol className={styles.windowsGuideSteps}>
        <li>Open Windows Terminal and choose {shellLabel}.</li>
        <li>Install Node.js, then install Git.</li>
        <li>Close that terminal window and open a new {shellLabel} window.</li>
        <li>Run the verify commands below before installing `nibras`.</li>
      </ol>
      <p className={styles.windowsGuideHint}>
        If you are unsure, use <strong>PowerShell</strong>. Use <strong>Git Bash</strong> only if
        you already want Unix-style paths like{' '}
        <code className={styles.inlineCode}>/c/projects/a1</code>.
      </p>
    </div>
  );
}

// ── Troubleshoot row ──────────────────────────────────────────────────────────
function TroubleshootRow({
  title,
  cause,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  cause: string;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${styles.troubleshootItem} ${isOpen ? styles.troubleshootItemOpen : ''}`}>
      <button
        className={styles.troubleshootHeader}
        onClick={onToggle}
        type="button"
        aria-expanded={isOpen}
      >
        <span className={styles.troubleshootTitle}>{title}</span>
        <svg
          className={`${styles.troubleshootChevron} ${isOpen ? styles.troubleshootChevronOpen : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3.5 5.5l3.5 3.5 3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className={styles.troubleshootBody}>
          <p className={styles.troubleshootCause}>{cause}</p>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Troubleshoot accordion ────────────────────────────────────────────────────
function TroubleshootAccordion({
  os,
  windowsShell,
  installCmd,
  loginCmd,
}: {
  os: OS;
  windowsShell: WindowsShell;
  installCmd: string;
  loginCmd: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const toggle = (id: string) => setOpenId((p) => (p === id ? null : id));
  const query = filter.trim().toLowerCase();

  function matchesFilter(title: string, cause: string) {
    if (!query) return true;
    return `${title} ${cause}`.toLowerCase().includes(query);
  }

  return (
    <div className={styles.troubleshootList}>
      <label className={styles.troubleshootSearch}>
        <span className={styles.troubleshootSearchLabel}>Filter issues</span>
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search troubleshooting…"
          className={styles.troubleshootSearchInput}
        />
      </label>

      {matchesFilter('"nibras: command not found" after install', 'PATH npm global bin') && (
        <TroubleshootRow
          title='"nibras: command not found" after install'
          cause="The npm global bin directory is not in PATH, or the terminal was not restarted after install."
          isOpen={openId === 'ts-01'}
          onToggle={() => toggle('ts-01')}
        >
          <OsCode
            os={os}
            mac={`npm config get prefix\n# Add the bin folder to PATH:\nexport PATH="$(npm config get prefix)/bin:$PATH"\n# Make it permanent — append to ~/.zshrc`}
            linux={`npm config get prefix\nexport PATH="$(npm config get prefix)/bin:$PATH"\n# Make it permanent — append to ~/.bashrc or ~/.zshrc`}
            windows={
              windowsShell === 'gitbash'
                ? `npm config get prefix\nexport PATH="$(npm config get prefix)/bin:$PATH"\n# Make it permanent — append to ~/.bashrc`
                : `# Close and reopen PowerShell first, then:\nnpm config get prefix\n# Add to user PATH permanently:\n$p = (npm config get prefix).Trim()\n[Environment]::SetEnvironmentVariable("Path","$([Environment]::GetEnvironmentVariable('Path','User'));$p","User")\n# Open a new terminal.`
            }
          />
          <p className={styles.hint}>
            With nvm, the global bin is always in PATH automatically — no manual steps.
          </p>
        </TroubleshootRow>
      )}

      {os !== 'windows' &&
        matchesFilter('"EACCES: permission denied" on global install', 'permission sudo nvm') && (
          <TroubleshootRow
            title='"EACCES: permission denied" on global install'
            cause="System Node.js requires root to write to the global npm directory. Never use sudo npm install -g."
            isOpen={openId === 'ts-02'}
            onToggle={() => toggle('ts-02')}
          >
            <OsCode
              os={os}
              mac={`# Recommended: switch to nvm\ncurl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash\nsource ~/.zshrc && nvm install --lts && nvm use --lts\n${NPM_INSTALL_COMMAND}\n\n# Alternative: fix the npm global prefix without sudo\nmkdir -p ~/.npm-global && npm config set prefix '~/.npm-global'\nexport PATH="$HOME/.npm-global/bin:$PATH"`}
              linux={`# Recommended: switch to nvm\ncurl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash\nsource ~/.bashrc && nvm install --lts && nvm use --lts\n${NPM_INSTALL_COMMAND}\n\n# Alternative: fix the npm global prefix without sudo\nmkdir -p ~/.npm-global && npm config set prefix '~/.npm-global'\nexport PATH="$HOME/.npm-global/bin:$PATH"`}
            />
          </TroubleshootRow>
        )}

      {matchesFilter('"EEXIST" or "ENOTDIR" — stale global link', 'stale symlink') && (
        <TroubleshootRow
          title='"EEXIST" or "ENOTDIR" — stale global link'
          cause="An older Nibras install left behind a broken symlink or directory."
          isOpen={openId === 'ts-03'}
          onToggle={() => toggle('ts-03')}
        >
          {os === 'windows' && (
            <>
              <p className={styles.hint}>Shell:</p>
              <p className={styles.hint} style={{ marginTop: 0 }}>
                (The command below matches your selected shell above)
              </p>
            </>
          )}
          <CliCodeBlock code={installCmd} />
        </TroubleshootRow>
      )}

      {os === 'windows' &&
        matchesFilter(
          '"execution of scripts is disabled on this system"',
          'PowerShell execution policy'
        ) && (
          <TroubleshootRow
            title='"execution of scripts is disabled on this system"'
            cause="PowerShell execution policy is set to Restricted."
            isOpen={openId === 'ts-04'}
            onToggle={() => toggle('ts-04')}
          >
            <CliCodeBlock
              code={`# Run once in PowerShell as Administrator:\nSet-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`}
            />
            <p className={styles.hint}>Only needs to be done once per machine.</p>
          </TroubleshootRow>
        )}

      {matchesFilter('"AUTH_REQUIRED" or "INVALID_SESSION"', 'session token expired') && (
        <TroubleshootRow
          title='"AUTH_REQUIRED" or "INVALID_SESSION"'
          cause="Session token expired, revoked, or wrong API URL saved."
          isOpen={openId === 'ts-05'}
          onToggle={() => toggle('ts-05')}
        >
          <CliCodeBlock code={loginCmd ?? 'nibras login --api-base-url <your-api-url>'} />
        </TroubleshootRow>
      )}

      {matchesFilter(
        '"remote: Repository not found" or push rejected',
        'GitHub App repository'
      ) && (
        <TroubleshootRow
          title='"remote: Repository not found" or push rejected'
          cause="GitHub App not installed on the account, or the student repository was not created."
          isOpen={openId === 'ts-06'}
          onToggle={() => toggle('ts-06')}
        >
          <CliCodeBlock
            code={`nibras ping\n# Check the GitHub App install status in the output above.\n# Follow the install link if the App shows as "not installed".`}
          />
        </TroubleshootRow>
      )}

      {matchesFilter('Browser did not open during login', 'browser launch') && (
        <TroubleshootRow
          title="Browser did not open during login"
          cause="The CLI could not launch the system browser automatically."
          isOpen={openId === 'ts-07'}
          onToggle={() => toggle('ts-07')}
        >
          <CliCodeBlock
            code={`${loginCmd ?? 'nibras login --api-base-url <url>'} --no-open\n# Copy the printed URL and paste it into any browser manually.`}
          />
        </TroubleshootRow>
      )}

      {os === 'windows' &&
        matchesFilter('"LF will be replaced by CRLF" warnings', 'line endings git autocrlf') && (
          <TroubleshootRow
            title='"LF will be replaced by CRLF" warnings'
            cause="Git is converting Unix line endings to Windows-style on checkout."
            isOpen={openId === 'ts-08'}
            onToggle={() => toggle('ts-08')}
          >
            <CliCodeBlock code={`git config --global core.autocrlf input`} />
            <p className={styles.hint}>
              These warnings are cosmetic and do not affect submission results. Run the command
              above once to suppress them globally.
            </p>
          </TroubleshootRow>
        )}

      {os === 'windows' &&
        matchesFilter('WSL2 path or permission issues', 'WSL Windows Subsystem Linux') && (
          <TroubleshootRow
            title="WSL2 path or permission issues"
            cause="Mixing Windows npm with a Linux project directory inside WSL often breaks global installs and git remotes."
            isOpen={openId === 'ts-09'}
            onToggle={() => toggle('ts-09')}
          >
            <p className={styles.bodyText}>
              Pick one environment and stay in it: install Node.js and the CLI inside WSL, then use
              Linux paths like <code className={styles.inlineCode}>~/projects/a1</code>. Avoid
              running <code className={styles.inlineCode}>nibras</code> from PowerShell against a
              repo that lives under <code className={styles.inlineCode}>\\wsl$</code>.
            </p>
          </TroubleshootRow>
        )}

      {matchesFilter('Corporate proxy or SSL errors', 'proxy certificate HTTPS') && (
        <TroubleshootRow
          title="Corporate proxy or SSL errors"
          cause="npm or git cannot reach GitHub or the Nibras API through your network."
          isOpen={openId === 'ts-10'}
          onToggle={() => toggle('ts-10')}
        >
          <CliCodeBlock
            code={`# Ask IT for proxy settings, then configure npm/git once:\nnpm config set proxy http://proxy.example:8080\nnpm config set https-proxy http://proxy.example:8080\ngit config --global http.proxy http://proxy.example:8080`}
          />
          <p className={styles.hint}>
            If installs succeed but login fails, verify the hosted API URL with your instructor.
          </p>
        </TroubleshootRow>
      )}

      {matchesFilter('When to use nibras doctor vs nibras ping', 'diagnostics doctor ping') && (
        <TroubleshootRow
          title="When to use nibras doctor vs nibras ping"
          cause="Both commands help, but they check different layers of the stack."
          isOpen={openId === 'ts-11'}
          onToggle={() => toggle('ts-11')}
        >
          <p className={styles.bodyText}>
            Run <code className={styles.inlineCode}>nibras ping</code> first for auth, API, GitHub
            App, and project status. Use <code className={styles.inlineCode}>nibras doctor</code>{' '}
            when installs look fine but local tooling (Node.js, npm, git versions and PATH) still
            seems wrong.
          </p>
        </TroubleshootRow>
      )}
    </div>
  );
}

// ── Flow step icon components ─────────────────────────────────────────────────
function CourseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 5h12M4 10h8M4 15h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="15.5" cy="14.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M15.5 13v1.5l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9l6-3M7 11l6 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h1M16 10h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ── Flow overview data ────────────────────────────────────────────────────────
const FLOW_STEPS_DATA = [
  {
    Icon: CourseIcon,
    label: 'Create a course',
    desc: 'Set up your course and project keys on the web dashboard.',
  },
  {
    Icon: ProjectIcon,
    label: 'Configure projects',
    desc: 'Define allowed files, test commands, and grading settings.',
  },
  {
    Icon: ShareIcon,
    label: 'Share with students',
    desc: 'Students install the CLI, log in, and run nibras setup.',
  },
  {
    Icon: ReviewIcon,
    label: 'Review submissions',
    desc: 'Auto-verified results appear instantly in your dashboard.',
  },
];

// ── Flow overview ─────────────────────────────────────────────────────────────
function FlowOverview() {
  return (
    <div className={styles.flowSection}>
      <p className={styles.flowEyebrow}>How Nibras Works</p>
      <div className={styles.flowGrid}>
        {FLOW_STEPS_DATA.map(({ Icon, label, desc }, i) => (
          <div key={label} className={styles.flowCard}>
            <div className={styles.flowCardIcon}>
              <Icon />
            </div>
            <div className={styles.flowCardLabel}>{label}</div>
            <div className={styles.flowCardDesc}>{desc}</div>
            {i < FLOW_STEPS_DATA.length - 1 && (
              <div className={styles.flowArrow} aria-hidden="true">
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Video placeholder ─────────────────────────────────────────────────────────
function VideoPlaceholder({ title, youtubeId }: { title: string; youtubeId?: string }) {
  if (youtubeId) {
    return (
      <div className={styles.videoEmbed}>
        <div className={styles.videoEmbedHeader}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <polygon points="3,2 12,7 3,12" fill="currentColor" />
          </svg>
          <span className={styles.videoEmbedLabel}>{title}</span>
        </div>
        <div className={styles.videoEmbedFrame}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className={styles.videoEmbedIframe}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.videoPlaceholder}>
      <div className={styles.videoPlayBtn}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <polygon points="5,3 15,9 5,15" fill="currentColor" />
        </svg>
      </div>
      <div className={styles.videoInfo}>
        <span className={styles.videoTitle}>{title}</span>
        <span className={styles.videoBadge}>Video walkthrough · Coming soon</span>
      </div>
    </div>
  );
}

function ShareLinkCopy({ setupGuideUrl }: { setupGuideUrl: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(setupGuideUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.shareLinkCopy}>
      <div>
        <p className={styles.shareLinkCopyLabel}>Student setup guide URL</p>
        <code className={styles.shareLinkCopyUrl}>{setupGuideUrl}</code>
      </div>
      <button type="button" className={styles.emailCopyBtn} onClick={copy}>
        {copied ? '✓ Copied' : 'Copy link'}
      </button>
    </div>
  );
}

// ── Email template ────────────────────────────────────────────────────────────
function EmailTemplate({
  apiBaseUrl,
  projectKey = DEFAULT_PROJECT_KEY,
  os,
  windowsShell,
  setupGuideUrl,
}: {
  apiBaseUrl: string | null;
  projectKey?: string;
  os: OS;
  windowsShell: WindowsShell;
  setupGuideUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const subject = `Getting started with Nibras CLI – ${projectKey}`;
  const body = buildStudentEmailBody({
    apiBaseUrl,
    projectKey,
    os,
    windowsShell,
    setupGuideUrl,
  });

  function copy() {
    void navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.emailTemplate}>
      <div className={styles.emailTemplateHeader}>
        <span className={styles.emailTemplateLabel}>Student email template</span>
        <button className={styles.emailCopyBtn} onClick={copy} type="button">
          {copied ? '✓ Copied' : 'Copy message'}
        </button>
      </div>
      <div className={styles.emailSubject}>
        <strong>Subject:</strong> {subject}
      </div>
      <pre className={styles.emailBody}>{body}</pre>
    </div>
  );
}

function AccountStatusPanel({
  githubLinked,
  githubAppInstalled,
  enrollmentCount,
  suggested,
}: {
  githubLinked: boolean;
  githubAppInstalled: boolean;
  enrollmentCount: number;
  suggested: CompletionState;
}) {
  return (
    <div className={styles.accountStatus}>
      <p className={styles.accountStatusTitle}>Account checklist</p>
      <div className={styles.accountStatusGrid}>
        <span
          className={`${styles.accountStatusChip} ${githubLinked ? styles.accountStatusChipDone : ''}`}
        >
          {githubLinked ? '✓' : '○'} GitHub linked
        </span>
        <span
          className={`${styles.accountStatusChip} ${githubAppInstalled ? styles.accountStatusChipDone : ''}`}
        >
          {githubAppInstalled ? '✓' : '○'} GitHub App installed
        </span>
        <span
          className={`${styles.accountStatusChip} ${enrollmentCount > 0 ? styles.accountStatusChipDone : ''}`}
        >
          {enrollmentCount > 0 ? '✓' : '○'} {enrollmentCount} course
          {enrollmentCount === 1 ? '' : 's'} enrolled
        </span>
      </div>
      {Object.keys(suggested).length > 0 && (
        <p className={styles.hint}>
          Steps marked on your account:{' '}
          {Object.entries(suggested)
            .filter(([, done]) => done)
            .map(([id]) => id.replace('step-', ''))
            .join(', ')}
        </p>
      )}
    </div>
  );
}

function MobileStepNav({
  steps,
  activeStep,
  completion,
  onSelect,
}: {
  steps: Array<{ id: string; number: string; label: string }>;
  activeStep: string;
  completion: CompletionState;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles.mobileStepNav} aria-label="Setup steps">
      {steps.map(({ id, number, label }) => {
        const done = !!completion[id];
        return (
          <button
            key={id}
            type="button"
            className={`${styles.mobileStepChip} ${activeStep === id ? styles.mobileStepChipActive : ''} ${done ? styles.mobileStepChipDone : ''}`}
            onClick={() => onSelect(id)}
          >
            <span className={styles.mobileStepChipNum}>{done ? '✓' : number}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ApiUrlPanel({
  apiBaseUrl,
  discoveryState,
  discoveryError,
  manualApiUrl,
  onManualApiUrlChange,
}: {
  apiBaseUrl: string | null;
  discoveryState: 'loading' | 'ready' | 'error';
  discoveryError: string | null;
  manualApiUrl: string;
  onManualApiUrlChange: (value: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const effectiveUrl = apiBaseUrl ?? (manualApiUrl.trim() || null);

  function copyUrl() {
    if (!effectiveUrl) return;
    void navigator.clipboard.writeText(effectiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (discoveryState === 'loading') {
    return (
      <div className={`${styles.callout} ${styles.calloutInfo}`}>
        <span className={styles.calloutIcon}>ℹ</span>
        <p>Checking which API this deployment uses…</p>
      </div>
    );
  }

  return (
    <div className={styles.apiUrlPanel}>
      {effectiveUrl ? (
        <div className={styles.apiUrlChipRow}>
          <code className={styles.apiUrlChip}>{effectiveUrl}</code>
          <button type="button" className={styles.emailCopyBtn} onClick={copyUrl}>
            {copied ? '✓ Copied' : 'Copy API URL'}
          </button>
        </div>
      ) : (
        <p className={styles.bodyText}>
          {discoveryError ??
            'Unable to verify a reachable API. Paste the hosted API URL from your admin below.'}
        </p>
      )}
      {(discoveryState === 'error' || manualApiUrl) && (
        <label className={styles.apiUrlManual}>
          <span className={styles.apiUrlManualLabel}>Manual API URL override</span>
          <input
            type="url"
            value={manualApiUrl}
            onChange={(event) => onManualApiUrlChange(event.target.value)}
            placeholder="https://api.yourschool.edu"
            className={styles.apiUrlManualInput}
          />
        </label>
      )}
      {discoveryState === 'error' && (
        <p className={styles.hint}>
          Admins can set <code className={styles.inlineCode}>NEXT_PUBLIC_NIBRAS_API_BASE_URL</code>{' '}
          in the web deployment environment.
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function OnboardingPageContent({
  defaultViewMode = 'instructor',
  basePath = '/instructor/onboarding',
}: OnboardingPageProps) {
  const { user } = useSession();
  const [os, setOs] = useState<OS>('mac');
  const [windowsShell, setWindowsShell] = useState<WindowsShell>('powershell');
  const [activeStep, setActiveStep] = useState('step-01');
  const [completion, setCompletion] = useState<CompletionState>({});
  const [hostedApiBaseUrl, setHostedApiBaseUrl] = useState<string | null>(null);
  const [apiDiscoveryState, setApiDiscoveryState] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [apiDiscoveryError, setApiDiscoveryError] = useState<string | null>(null);

  // Role detection
  const isInstructor =
    user?.systemRole === 'admin' ||
    (user?.memberships?.some((m) => {
      const r = m.role.toLowerCase();
      return r === 'instructor' || r === 'ta';
    }) ??
      false);

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [manualApiUrl, setManualApiUrl] = useState('');
  const [suggestedProgress, setSuggestedProgress] = useState<CompletionState>({});
  const [selectedProjectKey, setSelectedProjectKey] = useState(DEFAULT_PROJECT_KEY);

  const setViewModeWithUrl = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState(null, '', url.toString());
  }, []);

  useEffect(() => {
    if (defaultViewMode === 'student') {
      setViewMode('student');
      return;
    }
    if (!user) return;
    const fromUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('mode')
        : null;
    if (fromUrl === 'student' || fromUrl === 'instructor') {
      if (isInstructor || fromUrl === 'student') setViewMode(fromUrl);
      return;
    }
    setViewMode(isInstructor ? 'instructor' : 'student');
  }, [user, isInstructor, defaultViewMode]);

  // Derived steps and count for current mode
  const STEPS = getSteps(viewMode);
  const TOTAL_STEPS = viewMode === 'instructor' ? TOTAL_STEPS_INSTRUCTOR : TOTAL_STEPS_STUDENT;

  // Load OS + completion on mount / when user changes
  useEffect(() => {
    const saved = prefs.getOnboardingOs() as OS | null;
    setOs(saved ?? detectOS());
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setCompletion(loadCompletion());
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch('/v1/me/onboarding-progress', { auth: true });
        if (!res.ok) throw new Error('Failed to load onboarding progress');
        const payload = (await res.json()) as {
          progress?: CompletionState;
          suggested?: CompletionState;
        };
        if (cancelled) return;
        const local = loadCompletion(userId);
        setCompletion({ ...local, ...(payload.progress ?? {}) });
        setSuggestedProgress(payload.suggested ?? {});
      } catch {
        if (!cancelled) setCompletion(loadCompletion(userId));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const { data: instructorCourses } = useFetch<InstructorCourse[]>(
    viewMode === 'instructor' && isInstructor ? '/v1/tracking/courses' : null
  );
  const firstCourseId = instructorCourses?.[0]?.id ?? null;
  const { data: instructorProjects } = useFetch<InstructorProject[]>(
    firstCourseId ? `/v1/tracking/courses/${firstCourseId}/projects` : null
  );

  const projectOptions = useMemo(() => {
    const keys =
      instructorProjects
        ?.filter((project) => project.status === 'published')
        .map((project) => project.projectKey) ?? [];
    return keys.length > 0 ? keys : [DEFAULT_PROJECT_KEY];
  }, [instructorProjects]);

  useEffect(() => {
    if (projectOptions.includes(selectedProjectKey)) return;
    setSelectedProjectKey(projectOptions[0] ?? DEFAULT_PROJECT_KEY);
  }, [projectOptions, selectedProjectKey]);

  const effectiveApiBaseUrl =
    hostedApiBaseUrl ?? (manualApiUrl.trim() ? manualApiUrl.trim().replace(/\/$/, '') : null);

  // API discovery
  useEffect(() => {
    let cancelled = false;
    setApiDiscoveryState('loading');
    setApiDiscoveryError(null);

    void discoverOnboardingApiBaseUrl({
      configuredApiBaseUrl: process.env.NEXT_PUBLIC_NIBRAS_API_BASE_URL ?? null,
      pageOrigin: typeof window === 'undefined' ? null : window.location.origin,
      probe: async (candidate) => {
        const response = await fetch(`${candidate}/v1/health`);
        return response.ok;
      },
    })
      .then((url) => {
        if (cancelled) return;
        setHostedApiBaseUrl(url);
        setApiDiscoveryState('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setHostedApiBaseUrl(null);
        setApiDiscoveryState('error');
        setApiDiscoveryError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist OS selection
  function handleSetOs(v: OS) {
    setOs(v);
    prefs.setOnboardingOs(v);
  }

  // Step completion toggle
  function toggleStep(id: string) {
    setCompletion((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCompletion(next, user?.id);
      if (user) {
        void apiFetch('/v1/me/onboarding-progress', {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify({ progress: next }),
        });
      }
      return next;
    });
  }

  useEffect(() => {
    const first = STEPS[0]?.id;
    if (first) setActiveStep(first);
  }, [viewMode, STEPS]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const step = new URLSearchParams(window.location.search).get('step');
    if (!step || !STEPS.some((entry) => entry.id === step)) return;
    setActiveStep(step);
    window.setTimeout(() => scrollTo(step), 120);
  }, [viewMode, STEPS]);

  // IntersectionObserver — active section tracking
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    STEPS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveStep(id);
        },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Derived values (only count steps visible in the current view)
  const completedCount = STEPS.filter((s) => completion[s.id]).length;
  const progressPct = TOTAL_STEPS > 0 ? Math.round((completedCount / TOTAL_STEPS) * 100) : 0;
  const allDone = completedCount === TOTAL_STEPS && TOTAL_STEPS > 0;
  const stepNum = (id: string) => stepNumber(id, viewMode);
  const commandReferenceGroups =
    viewMode === 'student'
      ? COMMAND_REFERENCE_GROUPS.filter((g) => !COMMAND_REFERENCE_STUDENT_HIDDEN.has(g.title))
      : COMMAND_REFERENCE_GROUPS;

  const configPath = getOnboardingConfigPath(os);
  const dirExample = getOnboardingDirExample(os, windowsShell, selectedProjectKey);
  const loginCommand = effectiveApiBaseUrl ? buildHostedLoginCommand(effectiveApiBaseUrl) : null;
  const studentQuickStart = effectiveApiBaseUrl
    ? buildStudentQuickStart(effectiveApiBaseUrl, selectedProjectKey, os, windowsShell)
    : null;
  const primaryInstallCommand = getInstallCommand(os, windowsShell);
  const installTroubleshootingCommand = getInstallTroubleshootingCommand(os, windowsShell);
  const githubLogin = getShellUserIdentity(user, 'student');
  const setupOutput = buildSetupOutput(selectedProjectKey, githubLogin);
  const setupGuideUrl =
    typeof window === 'undefined'
      ? `${basePath}?mode=student`
      : `${window.location.origin}${basePath}?mode=student`;
  const firstIncompleteStep = STEPS.find((step) => !completion[step.id])?.id ?? STEPS[0]?.id;
  const enrollmentCount =
    user?.memberships?.filter((membership) => membership.role === 'student').length ?? 0;
  const membersHref = firstCourseId
    ? `/instructor/courses/${firstCourseId}/members`
    : '/instructor/courses/new';
  const submissionsHref = firstCourseId
    ? `/instructor/courses/${firstCourseId}/submissions`
    : '/instructor';

  const loginOutput: TerminalLine[] = [
    { type: 'cmd', text: loginCommand ?? 'nibras login --api-base-url https://api.example.com' },
    { type: 'blank' },
    {
      type: 'success',
      text: '╭──────────────────────────────────────────────────────────────╮',
    },
    { type: 'success', text: '│  ℹ  Authorize this device                                   │' },
    {
      type: 'muted',
      text: '│  Open in browser: https://nibras-web.fly.dev/dev/approve?...│',
    },
    { type: 'muted', text: '│  Code:            ABCD-1234                                 │' },
    { type: 'muted', text: '│  Browser launch: automatic                                  │' },
    {
      type: 'success',
      text: '╰──────────────────────────────────────────────────────────────╯',
    },
    { type: 'blank' },
    { type: 'muted', text: '  ⠋ Waiting for browser authorization…' },
    { type: 'blank' },
    { type: 'success', text: '╭─────────────────────────────────────────╮' },
    { type: 'success', text: `│  ✓  Authenticated as ${githubLogin.slice(0, 14).padEnd(14)} │` },
    { type: 'muted', text: `│  User:    ${githubLogin.slice(0, 14).padEnd(14)} │` },
    { type: 'muted', text: `│  GitHub:  ${githubLogin.slice(0, 14).padEnd(14)} │` },
    {
      type: 'muted',
      text: `│  API:     ${(effectiveApiBaseUrl ?? 'https://api.example.com').slice(0, 28).padEnd(28)} │`,
    },
    { type: 'success', text: '╰─────────────────────────────────────────╯' },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <nav className={styles.stepNav} aria-label="Setup steps">
        {/* Progress bar */}
        <div className={styles.stepNavProgressWrap}>
          <div
            className={styles.stepNavProgressBar}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.stepNavProgressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <span className={styles.stepNavCount}>
            {completedCount}/{TOTAL_STEPS} done
          </span>
        </div>

        {STEPS.map(({ id, number, label }) => {
          const done = !!completion[id];
          return (
            <button
              key={id}
              className={`${styles.stepNavItem} ${activeStep === id ? styles.stepNavItemActive : ''} ${done ? styles.stepNavItemDone : ''}`}
              onClick={() => scrollTo(id)}
            >
              <span className={`${styles.stepNavNum} ${done ? styles.stepNavNumDone : ''}`}>
                {done ? (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                    <path
                      d="M1 4.5l2.5 2.5 4.5-4.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  number
                )}
              </span>
              <span className={styles.stepNavLabel}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className={styles.page}>
        {/* Hero */}
        <div className={`${styles.hero} ${allDone ? styles.heroDone : ''}`}>
          {/* Radial glow backdrop */}
          <div className={styles.heroGlow} aria-hidden="true" />
          <CliSetupGuideControls
            className={styles.heroTopRow}
            badgeLabel={allDone ? 'Setup complete' : 'CLI Setup Guide'}
            badgeDone={allDone}
            progressLabel={
              completedCount > 0 && !allDone ? `${completedCount}/${TOTAL_STEPS} steps done` : null
            }
            viewMode={viewMode}
            onViewModeChange={isInstructor ? setViewModeWithUrl : undefined}
            showViewSwitch={isInstructor}
          />
          <h1 className={styles.heroTitle}>
            {allDone ? "You're all set" : 'Get the Nibras CLI running'}
          </h1>
          <p className={styles.heroSub}>
            {allDone
              ? viewMode === 'instructor'
                ? "The CLI is installed, you're authenticated, and the project is set up. Head to the instructor dashboard to manage courses and review submissions."
                : "The CLI is installed and you're authenticated. Head to your dashboard to view your courses and submit assignments."
              : viewMode === 'instructor'
                ? 'Install the CLI, authenticate with GitHub, create a course and project, then share with students — step by step, for your OS.'
                : 'Install the CLI, authenticate with GitHub, set up your project, and make your first submission — step by step, for your OS.'}
          </p>
          {/* Outcome chips */}
          {!allDone && (
            <div className={styles.heroOutcomes}>
              {viewMode === 'instructor' ? (
                <>
                  <span className={styles.heroOutcomeChip}>✓ Students submit via CLI</span>
                  <span className={styles.heroOutcomeChip}>✓ Auto-verified results</span>
                  <span className={styles.heroOutcomeChip}>✓ Full instructor dashboard</span>
                </>
              ) : (
                <>
                  <span className={styles.heroOutcomeChip}>✓ GitHub-backed submissions</span>
                  <span className={styles.heroOutcomeChip}>✓ Live terminal feedback</span>
                  <span className={styles.heroOutcomeChip}>✓ Instant pass/fail results</span>
                </>
              )}
            </div>
          )}
          {/* Meta row */}
          <div className={styles.heroMeta}>
            <span className={styles.heroMetaItem}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" />
                <path
                  d="M6 3v3l2 1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              ~5 min
            </span>
            <span className={styles.heroMetaDot}>·</span>
            <span className={styles.heroMetaItem}>{TOTAL_STEPS} steps</span>
            <span className={styles.heroMetaDot}>·</span>
            <span className={styles.heroMetaItem}>macOS · Linux · Windows</span>
          </div>
          <OsTabs os={os} setOs={handleSetOs} />
          <MobileStepNav
            steps={STEPS}
            activeStep={activeStep}
            completion={completion}
            onSelect={scrollTo}
          />
          {user ? (
            <AccountStatusPanel
              githubLinked={user.githubLinked}
              githubAppInstalled={user.githubAppInstalled}
              enrollmentCount={enrollmentCount}
              suggested={suggestedProgress}
            />
          ) : null}
          <div className={styles.heroActions}>
            {viewMode === 'instructor' ? (
              <>
                <Link href="/instructor/courses/new" className={styles.btnPrimary}>
                  {allDone ? 'Go to dashboard →' : 'Create a course first →'}
                </Link>
                <a
                  href="https://github.com/nibras-platform/nibras"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.btnGhost}
                >
                  GitHub →
                </a>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={styles.btnPrimary}>
                  {allDone ? 'Go to dashboard →' : 'Open your dashboard →'}
                </Link>
                <Link href="/courses" className={styles.btnGhost}>
                  My Courses →
                </Link>
              </>
            )}
          </div>
        </div>

        {viewMode === 'instructor' && <FlowOverview />}

        <div className={styles.content}>
          {/* ── 01 Prerequisites ──────────────────────────────────────────── */}
          <Section
            id="step-01"
            number={stepNum('step-01')}
            title="Prerequisites"
            completed={!!completion['step-01']}
            onToggleComplete={() => toggleStep('step-01')}
            defaultOpen={firstIncompleteStep === 'step-01'}
          >
            <p className={styles.bodyText}>
              You need <strong>Node.js ≥ 18</strong>, <strong>npm ≥ 9</strong>, and{' '}
              <strong>git</strong> before installing the CLI. Follow the steps for your OS.
            </p>
            <VideoPlaceholder
              title="Installing Node.js, npm, and Git"
              youtubeId={STEP_VIDEOS['step-01']}
            />

            {os === 'windows' && (
              <WindowsQuickStart shell={windowsShell} setShell={setWindowsShell} />
            )}

            {/* Node.js install */}
            <div className={styles.prereqBlock}>
              <p className={styles.prereqHeading}>
                <span className={styles.prereqNum}>①</span>
                Install Node.js ≥ 18 + npm
              </p>
              <OsCode
                os={os}
                mac={NODE_INSTALL_MAC}
                linux={NODE_INSTALL_LINUX}
                windows={NODE_INSTALL_WINDOWS}
              />
              {os !== 'windows' && (
                <div className={`${styles.callout} ${styles.calloutInfo}`}>
                  <span className={styles.calloutIcon}>ℹ</span>
                  <p>
                    nvm installs Node.js entirely in your home directory — no{' '}
                    <code className={styles.inlineCode}>sudo</code> or permission fixes ever needed.
                    If you already have a system Node.js and hit{' '}
                    <code className={styles.inlineCode}>EACCES</code>, see step 10.
                  </p>
                </div>
              )}
              {os === 'windows' && (
                <div className={`${styles.callout} ${styles.calloutInfo}`}>
                  <span className={styles.calloutIcon}>ℹ</span>
                  <p>
                    After installing, <strong>close and reopen</strong> your terminal so the updated
                    PATH takes effect before running npm.
                  </p>
                </div>
              )}
            </div>

            {/* Git install */}
            <div className={styles.prereqBlock}>
              <p className={styles.prereqHeading}>
                <span className={styles.prereqNum}>②</span>
                Install Git
              </p>
              <OsCode
                os={os}
                mac={GIT_INSTALL_MAC}
                linux={GIT_INSTALL_LINUX}
                windows={GIT_INSTALL_WINDOWS}
              />
            </div>

            {/* Verify */}
            <div className={styles.prereqBlock}>
              <p className={styles.prereqHeading}>
                <span className={styles.prereqNum}>③</span>
                Verify all three tools
              </p>
              <CliCodeBlock code={VERIFY_PREREQS} />
              <p className={styles.hint}>
                All three commands must return version numbers. If any fails, revisit the install
                step above and open a <strong>new terminal</strong> after installing.
              </p>
            </div>

            {/* PowerShell policy — Windows only */}
            {os === 'windows' && (
              <div className={styles.prereqBlock}>
                <p className={styles.prereqHeading}>
                  <span className={styles.prereqNum}>④</span>
                  Allow PowerShell scripts (if blocked)
                </p>
                <CliCodeBlock
                  code={`# Run once in PowerShell as Administrator:\nSet-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`}
                />
                <p className={styles.hint}>
                  Skip this step if <code className={styles.inlineCode}>npm --version</code> already
                  runs without error.
                </p>
              </div>
            )}

            {/* Checklist summary */}
            <div className={styles.checkList}>
              <CheckItem
                label={
                  <>
                    <strong>Node.js ≥ 18</strong> —{' '}
                    <code className={styles.inlineCode}>node --version</code> returns v18 or higher
                  </>
                }
              />
              <CheckItem
                label={
                  <>
                    <strong>npm ≥ 9</strong> —{' '}
                    <code className={styles.inlineCode}>npm --version</code> returns 9 or higher
                  </>
                }
              />
              <CheckItem
                label={
                  <>
                    <strong>Git</strong> — <code className={styles.inlineCode}>git --version</code>{' '}
                    returns any version
                  </>
                }
              />
              <CheckItem
                label={
                  <>
                    <strong>GitHub account</strong> — you will authenticate with GitHub OAuth in
                    step 03
                  </>
                }
              />
            </div>
          </Section>

          {/* ── 02 Install ─────────────────────────────────────────────────── */}
          <Section
            id="step-02"
            number={stepNum('step-02')}
            title="Install the CLI"
            completed={!!completion['step-02']}
            onToggleComplete={() => toggleStep('step-02')}
            defaultOpen={firstIncompleteStep === 'step-02'}
          >
            <p className={styles.bodyText}>
              Install the current CLI release ({PINNED_RELEASE_TAG}) with the one-line installer for
              your platform. It checks Node.js and npm, removes stale global installs, and installs
              the pinned <code className={styles.inlineCode}>@nibras/cli</code> package from npm.
            </p>
            <VideoPlaceholder
              title="Installing the Nibras CLI"
              youtubeId={STEP_VIDEOS['step-02']}
            />

            {os === 'windows' && (
              <div className={`${styles.callout} ${styles.calloutInfo}`}>
                <span className={styles.calloutIcon}>⊞</span>
                <div>
                  <p>
                    Run this in the same{' '}
                    <strong>{windowsShell === 'powershell' ? 'PowerShell' : 'Git Bash'}</strong>{' '}
                    window you verified above. If <code className={styles.inlineCode}>nibras</code>{' '}
                    is not recognized afterwards, close the terminal and open a fresh one before
                    troubleshooting anything else.
                  </p>
                </div>
              </div>
            )}

            {os === 'windows' ? (
              <>
                <WindowsShellTabs shell={windowsShell} setShell={setWindowsShell} />
                <CliCodeBlock code={primaryInstallCommand} />
              </>
            ) : (
              <OsCode
                os={os}
                mac={getUnixInstallCommand()}
                linux={getUnixInstallCommand()}
                windows={getWindowsInstallCommand()}
              />
            )}
            <p className={styles.hint}>
              Prefer npm directly? Run{' '}
              <code className={styles.inlineCode}>{NPM_INSTALL_COMMAND}</code>.
            </p>
            <p className={styles.hint}>
              From a git clone: <code className={styles.inlineCode}>bash scripts/install.sh</code>{' '}
              (macOS / Linux / Git Bash) or{' '}
              <code className={styles.inlineCode}>
                powershell -ExecutionPolicy Bypass -File scripts/install.ps1
              </code>{' '}
              (Windows).
            </p>
            <p className={styles.hint}>
              Verify: <code className={styles.inlineCode}>nibras --version</code> should start with{' '}
              <code className={styles.inlineCode}>{PINNED_RELEASE_TAG}</code>, for example{' '}
              <code className={styles.inlineCode}>{PINNED_RELEASE_TAG}</code>.
            </p>
            <p className={styles.bodyText}>
              To reinstall later:{' '}
              <code className={styles.inlineCode}>
                nibras update --version {PINNED_RELEASE_TAG}
              </code>
              . To remove the CLI: <code className={styles.inlineCode}>nibras uninstall</code>.
            </p>
            <p className={styles.hint}>
              Use <code className={styles.inlineCode}>nibras update --check</code> to compare your
              installed version against the latest GitHub release before updating.
            </p>

            <div className={`${styles.callout} ${styles.calloutInfo}`}>
              <span className={styles.calloutIcon}>⚠</span>
              <div>
                <p>
                  If the install fails with <code className={styles.inlineCode}>EEXIST</code> or{' '}
                  <code className={styles.inlineCode}>ENOTDIR</code>, you have a stale global link.
                  Remove it and reinstall:
                </p>
                {os === 'windows' && (
                  <>
                    <p className={styles.hint} style={{ marginBottom: 6 }}>
                      Shell:
                    </p>
                    <WindowsShellTabs shell={windowsShell} setShell={setWindowsShell} />
                  </>
                )}
                <CliCodeBlock code={installTroubleshootingCommand} />
              </div>
            </div>
          </Section>

          {/* ── 03 Authenticate ────────────────────────────────────────────── */}
          <Section
            id="step-03"
            number={stepNum('step-03')}
            title="Authenticate with GitHub"
            completed={!!completion['step-03']}
            onToggleComplete={() => toggleStep('step-03')}
            defaultOpen={firstIncompleteStep === 'step-03'}
          >
            <p className={styles.bodyText}>
              Use an explicit <code className={styles.inlineCode}>--api-base-url</code> for hosted
              onboarding so the CLI targets this deployment instead of the local dev default at{' '}
              <code className={styles.inlineCode}>http://127.0.0.1:4848</code>. The login flow
              prints a one-time URL and short code, then tries to open the browser automatically
              unless you pass <code className={styles.inlineCode}>--no-open</code>.
            </p>
            <VideoPlaceholder
              title="GitHub OAuth authentication flow"
              youtubeId={STEP_VIDEOS['step-03']}
            />
            {os === 'windows' && (
              <div className={`${styles.callout} ${styles.calloutInfo}`}>
                <span className={styles.calloutIcon}>⊞</span>
                <div>
                  <p>
                    On Windows, the most common path is: run the login command in{' '}
                    <strong>{windowsShell === 'powershell' ? 'PowerShell' : 'Git Bash'}</strong>,
                    let the browser open, approve GitHub, then return to the same terminal window
                    and wait for the success box.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    If the browser does not open, rerun with{' '}
                    <code className={styles.inlineCode}>
                      {(loginCommand ?? 'nibras login --api-base-url <url>') + ' --no-open'}
                    </code>{' '}
                    and paste the printed URL into any browser manually.
                  </p>
                </div>
              </div>
            )}
            <ApiUrlPanel
              apiBaseUrl={hostedApiBaseUrl}
              discoveryState={apiDiscoveryState}
              discoveryError={apiDiscoveryError}
              manualApiUrl={manualApiUrl}
              onManualApiUrlChange={setManualApiUrl}
            />
            {loginCommand ? (
              <>
                <CliCodeBlock code={loginCommand} />
                <div className={styles.terminalWrapper}>
                  <TerminalMockup title="nibras login" lines={loginOutput} />
                </div>
              </>
            ) : null}
            <p className={styles.hint}>
              Credentials are saved in <code className={styles.inlineCode}>{configPath}</code>. Run{' '}
              <code className={styles.inlineCode}>nibras whoami</code> after login to confirm the
              active session and linked GitHub account.
            </p>
            <div className={`${styles.callout} ${styles.calloutInfo}`}>
              <span className={styles.calloutIcon}>⚙</span>
              <div>
                <p>
                  <strong>Install the GitHub App next.</strong> After login, run{' '}
                  <code className={styles.inlineCode}>nibras ping</code> and follow the App install
                  link if status shows missing. Without the App, pushes fail with “Repository not
                  found”.
                </p>
                <p style={{ marginTop: 8 }}>
                  Confirm installation under{' '}
                  <Link href="/settings" className={styles.link}>
                    Settings → GitHub
                  </Link>{' '}
                  or{' '}
                  <Link href="/install/complete" className={styles.link}>
                    GitHub App setup
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Section>

          {/* ── 04 Create a course (instructor only) ─────────────────────── */}
          {viewMode === 'instructor' && (
            <Section
              id="step-04"
              number={stepNum('step-04')}
              title="Create a course (web)"
              completed={!!completion['step-04']}
              onToggleComplete={() => toggleStep('step-04')}
              defaultOpen={firstIncompleteStep === 'step-04'}
            >
              <p className={styles.bodyText}>
                Before students can use the CLI, create a course and at least one published project
                from the web dashboard.
              </p>
              <VideoPlaceholder
                title="Creating a course and project"
                youtubeId={STEP_VIDEOS['step-04']}
              />
              <ol className={styles.steps}>
                <li>
                  Go to <strong>Instructor → New Course</strong> and enter the course code (e.g.{' '}
                  <code className={styles.inlineCode}>cs101</code>), title, and term.
                </li>
                <li>
                  Open the course, then <strong>+ New Project</strong> (or start from a template).
                </li>
                <li>
                  Configure allowed submission paths, the local test command, and publish the
                  project when ready.
                </li>
                <li>
                  Copy the <strong>project key</strong> from the course page (e.g.{' '}
                  <code className={styles.inlineCode}>{selectedProjectKey}</code>).
                </li>
              </ol>
              <div className={styles.footerCtaActions}>
                <Link href="/instructor/courses/new" className={styles.btnPrimary}>
                  Open course creator →
                </Link>
                {firstCourseId ? (
                  <Link
                    href={`/instructor/courses/${firstCourseId}/projects/new`}
                    className={styles.btnGhost}
                  >
                    Add project →
                  </Link>
                ) : null}
              </div>
            </Section>
          )}

          {viewMode === 'student' && (
            <Section
              id="step-join"
              number={stepNum('step-join')}
              title="Join a course"
              completed={!!completion['step-join']}
              onToggleComplete={() => toggleStep('step-join')}
              defaultOpen={firstIncompleteStep === 'step-join'}
            >
              <p className={styles.bodyText}>
                You need an active course membership before{' '}
                <code className={styles.inlineCode}>nibras setup</code> can provision your repo.
              </p>
              <ol className={styles.steps}>
                <li>
                  Open the invite link from your instructor (e.g.{' '}
                  <code className={styles.inlineCode}>/join/ABC123</code>) or enroll from the{' '}
                  <Link href="/catalog?tab=courses" className={styles.link}>
                    course catalog
                  </Link>{' '}
                  if the course is public.
                </li>
                <li>
                  Confirm the course appears under{' '}
                  <Link href="/courses" className={styles.link}>
                    My Courses
                  </Link>
                  .
                </li>
                <li>
                  Copy the project key your instructor shared, then continue to project setup below.
                </li>
              </ol>
              <Link href="/courses" className={styles.btnPrimary}>
                Open My Courses →
              </Link>
            </Section>
          )}

          {/* ── 05 Setup ───────────────────────────────────────────────────── */}
          <Section
            id="step-05"
            number={stepNum('step-05')}
            title="Set up a project locally"
            completed={!!completion['step-05']}
            onToggleComplete={() => toggleStep('step-05')}
            defaultOpen={firstIncompleteStep === 'step-05'}
          >
            {viewMode === 'student' ? (
              <p className={styles.bodyText}>
                Get the <strong>project key</strong> from your instructor or course page, then run{' '}
                <code className={styles.inlineCode}>nibras setup</code> in your project folder. The
                CLI writes <code className={styles.inlineCode}>.nibras/project.json</code>,{' '}
                <code className={styles.inlineCode}>.nibras/task.md</code>, and links your repo to
                Nibras.
              </p>
            ) : (
              <p className={styles.bodyText}>
                Run <code className={styles.inlineCode}>nibras setup</code> with the project key to
                bootstrap the local directory. It writes{' '}
                <code className={styles.inlineCode}>.nibras/project.json</code> and{' '}
                <code className={styles.inlineCode}>.nibras/task.md</code>, initialises git if
                needed, and adds <code className={styles.inlineCode}>origin</code> for the student
                repo.
              </p>
            )}
            {viewMode === 'instructor' && projectOptions.length > 0 && (
              <label className={styles.projectKeyPicker}>
                <span className={styles.projectKeyPickerLabel}>Example project key</span>
                <select
                  value={selectedProjectKey}
                  onChange={(event) => setSelectedProjectKey(event.target.value)}
                  className={styles.projectKeyPickerSelect}
                >
                  {projectOptions.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <VideoPlaceholder
              title="Running nibras setup for a project"
              youtubeId={STEP_VIDEOS['step-05']}
            />
            <CliCodeBlock code={`nibras setup --project ${selectedProjectKey}`} />
            <div className={styles.terminalWrapper}>
              <TerminalMockup title="nibras setup" lines={setupOutput} />
            </div>
            <p className={styles.bodyText}>
              For bundle-backed projects, setup may download starter files and create the initial
              commit. If the target directory already has{' '}
              <code className={styles.inlineCode}>.git</code>, setup refreshes the{' '}
              <code className={styles.inlineCode}>.nibras</code> metadata instead of re-extracting
              starter files.
            </p>
            {os === 'windows' && (
              <>
                <p className={styles.hint} style={{ marginBottom: 6 }}>
                  Shell for the <code className={styles.inlineCode}>--dir</code> path format:
                </p>
                <WindowsShellTabs shell={windowsShell} setShell={setWindowsShell} />
              </>
            )}
            <p className={styles.hint}>
              Specify a target directory: <code className={styles.inlineCode}>{dirExample}</code>
            </p>
          </Section>

          {/* ── 06 Tests ───────────────────────────────────────────────────── */}
          <Section
            id="step-06"
            number={stepNum('step-06')}
            title="Run local tests"
            completed={!!completion['step-06']}
            onToggleComplete={() => toggleStep('step-06')}
            defaultOpen={firstIncompleteStep === 'step-06'}
          >
            <p className={styles.bodyText}>
              Use <code className={styles.inlineCode}>nibras test</code> to run the
              manifest-configured test command for your OS. Pass{' '}
              <code className={styles.inlineCode}>--previous</code> only when the project manifest
              supports it.
            </p>
            <VideoPlaceholder
              title="Running nibras test locally"
              youtubeId={STEP_VIDEOS['step-06']}
            />
            <CliCodeBlock
              code={`nibras test\nnibras test --previous   # include previous milestone tests`}
            />
            <p className={styles.hint}>
              A non-zero exit means the configured test command failed. Projects that do not opt in
              to previous-milestone runs will reject{' '}
              <code className={styles.inlineCode}>--previous</code>.
            </p>
          </Section>

          {/* ── 07 Submit ──────────────────────────────────────────────────── */}
          <Section
            id="step-07"
            number={stepNum('step-07')}
            title="Submit your solution"
            completed={!!completion['step-07']}
            onToggleComplete={() => toggleStep('step-07')}
            defaultOpen={firstIncompleteStep === 'step-07'}
          >
            <p className={styles.bodyText}>
              <code className={styles.inlineCode}>nibras submit</code> runs the configured local
              test command, stages only allowed files, creates a commit, pushes to{' '}
              <code className={styles.inlineCode}>origin</code>, registers the submission, and polls
              for server-side verification.
            </p>
            <VideoPlaceholder
              title="Submitting your first solution"
              youtubeId={STEP_VIDEOS['step-07']}
            />
            <CliCodeBlock code="nibras submit" />
            <div className={styles.terminalWrapper}>
              <TerminalMockup title="nibras submit" lines={submitOutput} />
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutIcon}>💡</span>
              <p>
                Only files matching{' '}
                <code className={styles.inlineCode}>submission.allowedPaths</code> in your manifest
                are included — students can&apos;t accidentally submit test or grading files.
              </p>
            </div>
            <p className={styles.hint}>
              A failing local test run does not abort submission. The CLI records the local result
              and server-side verification continues regardless.
            </p>
          </Section>

          {/* ── 08 Check status ────────────────────────────────────────────── */}
          <Section
            id="step-08"
            number={stepNum('step-08')}
            title="Check status"
            completed={!!completion['step-08']}
            onToggleComplete={() => toggleStep('step-08')}
            defaultOpen={firstIncompleteStep === 'step-08'}
          >
            <p className={styles.bodyText}>Two diagnostic commands are available at any time:</p>
            <VideoPlaceholder
              title="Running nibras ping and nibras whoami"
              youtubeId={STEP_VIDEOS['step-08']}
            />
            <CliCodeBlock
              code={`nibras ping    # check API, auth, GitHub, GitHub App, and project status\nnibras whoami  # show signed-in user and linked GitHub account`}
            />
            <p className={styles.hint}>
              <code className={styles.inlineCode}>nibras ping</code> is the fastest way to diagnose
              any problem — run it first. When run inside a project directory it also shows the
              project key and <code className={styles.inlineCode}>origin</code> remote.
            </p>
            {viewMode === 'instructor' && (
              <p className={styles.hint}>
                After students submit, review results in{' '}
                <Link href={submissionsHref} className={styles.link}>
                  course submissions
                </Link>{' '}
                or open{' '}
                <Link href="/instructor" className={styles.link}>
                  Instructor dashboard
                </Link>
                .
              </p>
            )}
          </Section>
          {viewMode === 'instructor' && (
            <Section
              id="step-09"
              number={stepNum('step-09')}
              title="Share with students"
              completed={!!completion['step-09']}
              onToggleComplete={() => toggleStep('step-09')}
              defaultOpen={firstIncompleteStep === 'step-09'}
            >
              <p className={styles.bodyText}>
                Students follow the same flow: install the CLI, log in with the hosted API URL, and
                run <code className={styles.inlineCode}>nibras setup --project &lt;key&gt;</code>.
                Share the project key, invite link, and student guide URL with your class.
              </p>

              <div className={`${styles.callout} ${styles.calloutInfo}`}>
                <span className={styles.calloutIcon}>ℹ</span>
                <p>
                  For private courses, create invite links under{' '}
                  <Link href={membersHref} className={styles.link}>
                    course members
                  </Link>
                  . Public courses can be joined from the catalog without an invite.
                </p>
              </div>

              <ShareLinkCopy setupGuideUrl={setupGuideUrl} />

              {os === 'windows' && (
                <div className={`${styles.callout} ${styles.calloutInfo}`}>
                  <span className={styles.calloutIcon}>⊞</span>
                  <p>
                    Windows students can use either <strong>PowerShell</strong> or{' '}
                    <strong>Git Bash</strong>. Match any troubleshooting snippets to the shell they
                    actually use.
                  </p>
                </div>
              )}

              <label className={styles.projectKeyPicker}>
                <span className={styles.projectKeyPickerLabel}>Project key to share</span>
                <select
                  value={selectedProjectKey}
                  onChange={(event) => setSelectedProjectKey(event.target.value)}
                  className={styles.projectKeyPickerSelect}
                >
                  {projectOptions.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.shareCard}>
                <div className={styles.shareCardTitle}>Student quick-start</div>
                {studentQuickStart ? (
                  <CliCodeBlock code={studentQuickStart} />
                ) : (
                  <p className={styles.bodyText} style={{ padding: '16px' }}>
                    {apiDiscoveryState === 'loading'
                      ? 'Waiting for a reachable hosted API before rendering the student login command…'
                      : (apiDiscoveryError ??
                        'Ask your admin for the hosted API URL before sharing the login command with students.')}
                  </p>
                )}
              </div>
              <EmailTemplate
                apiBaseUrl={effectiveApiBaseUrl}
                projectKey={selectedProjectKey}
                os={os}
                windowsShell={windowsShell}
                setupGuideUrl={setupGuideUrl}
              />
              <p className={styles.hint}>
                Students can view assignment instructions at any time with{' '}
                <code className={styles.inlineCode}>nibras task</code>. Full printable guide:{' '}
                <Link href="/docs/getting-started" className={styles.link}>
                  Getting started docs
                </Link>
                .
              </p>
            </Section>
          )}

          {/* ── 10 Troubleshooting ─────────────────────────────────────────── */}
          <Section
            id="step-10"
            number={stepNum('step-10')}
            title="Troubleshooting"
            completed={!!completion['step-10']}
            onToggleComplete={() => toggleStep('step-10')}
            defaultOpen={firstIncompleteStep === 'step-10'}
          >
            <p className={styles.bodyText}>
              Start with <code className={styles.inlineCode}>nibras ping</code> — it checks API
              reachability, auth, GitHub linkage, and App install status in one command. Use the OS
              tab above to filter fixes for your platform.
            </p>

            <TroubleshootAccordion
              os={os}
              windowsShell={windowsShell}
              installCmd={installTroubleshootingCommand}
              loginCmd={loginCommand}
            />

            <div className={`${styles.callout} ${styles.calloutInfo}`}>
              <span className={styles.calloutIcon}>💬</span>
              <p>
                Still stuck? Run <code className={styles.inlineCode}>nibras ping</code>, copy the
                full output, and share it with your instructor or open an issue at{' '}
                <a
                  href="https://github.com/nibras-platform/nibras/issues"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  github.com/nibras-platform/nibras
                </a>
                .
              </p>
            </div>
          </Section>

          {/* ── CLI Command Reference ──────────────────────────────────────── */}
          <section className={styles.referenceSection} aria-labelledby="cli-command-reference">
            <div className={styles.referenceIntro}>
              <h2 id="cli-command-reference" className={styles.referenceTitle}>
                CLI Command Reference
              </h2>
              <p className={styles.bodyText}>
                Use this appendix for commands outside the main onboarding path or when you need the
                full CLI surface at a glance.
              </p>
            </div>
            <div className={styles.referenceGroups}>
              {commandReferenceGroups.map((group) => (
                <section key={group.title} className={styles.referenceGroup}>
                  <h3 className={styles.referenceGroupTitle}>{group.title}</h3>
                  <div className={styles.referenceList}>
                    {group.items.map((item) => (
                      <div key={item.command} className={styles.referenceRow}>
                        <div className={styles.referenceCommand}>
                          <code className={styles.inlineCode}>{item.command}</code>
                        </div>
                        <div className={styles.referenceCopy}>
                          <p className={styles.referenceDescription}>{item.description}</p>
                          {item.note ? <p className={styles.referenceNote}>{item.note}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          {/* ── Footer CTA ─────────────────────────────────────────────────── */}
          <div className={`${styles.footerCta} ${allDone ? styles.footerCtaDone : ''}`}>
            {allDone ? (
              <>
                <div className={styles.footerCtaBadge}>🎉</div>
                <h3>You&apos;re all set!</h3>
                <p>
                  {viewMode === 'instructor'
                    ? "The CLI is installed, you're authenticated, and you've walked through every step. Head to the instructor dashboard to manage courses and review submissions."
                    : "The CLI is installed and you're authenticated. Head to your dashboard to view courses and submit assignments."}
                </p>
              </>
            ) : viewMode === 'instructor' ? (
              <>
                <h3>Ready to create your first course?</h3>
                <p>
                  Set up a course and project on the web, then share the project key with students.
                </p>
              </>
            ) : (
              <>
                <h3>Ready to set up your first project?</h3>
                <p>
                  Join your course, run setup with your project key, then make your first
                  submission.
                </p>
              </>
            )}
            <div className={styles.footerCtaActions}>
              {viewMode === 'instructor' ? (
                <>
                  <Link href="/instructor/courses/new" className={styles.btnPrimary}>
                    {allDone ? 'Go to instructor dashboard →' : 'Create a course →'}
                  </Link>
                  <Link href="/instructor" className={styles.btnGhost}>
                    Back to Instructor
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className={styles.btnPrimary}>
                    {allDone ? 'Go to dashboard →' : 'Open dashboard →'}
                  </Link>
                  <Link href="/courses" className={styles.btnGhost}>
                    My Courses
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
