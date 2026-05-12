'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import CliCodeBlock from '../../_components/cli-code-block';
import TerminalMockup, { type TerminalLine } from '../../_components/terminal-mockup';
import { prefs } from '../../../lib/prefs';
import {
  buildHostedLoginCommand,
  buildStudentQuickStart,
  discoverOnboardingApiBaseUrl,
  getInstallTroubleshootingCommand,
  getOnboardingConfigPath,
  getOnboardingDirExample,
  NPM_INSTALL_COMMAND,
  PINNED_RELEASE_TAG,
} from './onboarding-content.js';
import styles from './page.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────
type OS = 'mac' | 'linux' | 'windows';
type WindowsShell = 'powershell' | 'gitbash';
type CompletionState = Record<string, boolean>;

type CommandReferenceItem = {
  command: string;
  description: string;
  note?: string;
};

type CommandReferenceGroup = {
  title: string;
  items: CommandReferenceItem[];
};

// ── Constants ─────────────────────────────────────────────────────────────────
const COMPLETION_KEY = 'nibras.onboarding.completion';
const TOTAL_STEPS = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'mac';
  const p = navigator.platform?.toLowerCase() ?? '';
  const ua = navigator.userAgent?.toLowerCase() ?? '';
  if (p.includes('win') || ua.includes('windows')) return 'windows';
  if (p.includes('linux') || ua.includes('linux')) return 'linux';
  return 'mac';
}

function loadCompletion(): CompletionState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(COMPLETION_KEY);
    return raw ? (JSON.parse(raw) as CompletionState) : {};
  } catch {
    return {};
  }
}

function saveCompletion(state: CompletionState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(state));
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
const setupOutput: TerminalLine[] = [
  { type: 'cmd', text: 'nibras setup --project cs101/assignment-1' },
  { type: 'blank' },
  { type: 'muted', text: '  ⠋ Setting up project cs101/assignment-1…' },
  { type: 'muted', text: '  ⠋ Writing project manifest…' },
  { type: 'success', text: '  ✓ Project set up' },
  { type: 'blank' },
  { type: 'success', text: '╭────────────────────────────────────────────╮' },
  { type: 'success', text: '│  ✓  Project ready: cs101/assignment-1      │' },
  { type: 'muted', text: '│  Project: cs101/assignment-1               │' },
  { type: 'muted', text: '│  Repo:    nibras-platform/cs101-Zied       │' },
  { type: 'muted', text: '│  Next steps:                               │' },
  { type: 'muted', text: '│    nibras task    — view task instructions │' },
  { type: 'muted', text: '│    nibras test    — run local tests        │' },
  { type: 'muted', text: '│    nibras submit  — submit your solution   │' },
  { type: 'success', text: '╰────────────────────────────────────────────╯' },
];

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
const STEPS = [
  { id: 'step-01', number: '01', label: 'Prerequisites' },
  { id: 'step-02', number: '02', label: 'Install the CLI' },
  { id: 'step-03', number: '03', label: 'Authenticate' },
  { id: 'step-04', number: '04', label: 'Create a course' },
  { id: 'step-05', number: '05', label: 'Set up a project' },
  { id: 'step-06', number: '06', label: 'Run tests' },
  { id: 'step-07', number: '07', label: 'Submit' },
  { id: 'step-08', number: '08', label: 'Check status' },
  { id: 'step-09', number: '09', label: 'Share with students' },
  { id: 'step-10', number: '10', label: 'Troubleshooting' },
];

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
        description: 'Show recent submissions with live status badges.',
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
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
  completed?: boolean;
  onToggleComplete?: () => void;
}) {
  const [open, setOpen] = useState(true);

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
  const toggle = (id: string) => setOpenId((p) => (p === id ? null : id));

  return (
    <div className={styles.troubleshootList}>
      {/* command not found */}
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

      {/* EACCES — mac/linux only */}
      {os !== 'windows' && (
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

      {/* EEXIST / ENOTDIR */}
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

      {/* PowerShell execution policy — windows only */}
      {os === 'windows' && (
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

      {/* AUTH_REQUIRED */}
      <TroubleshootRow
        title='"AUTH_REQUIRED" or "INVALID_SESSION"'
        cause="Session token expired, revoked, or wrong API URL saved."
        isOpen={openId === 'ts-05'}
        onToggle={() => toggle('ts-05')}
      >
        <CliCodeBlock code={loginCmd ?? 'nibras login --api-base-url <your-api-url>'} />
      </TroubleshootRow>

      {/* Remote not found */}
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

      {/* Browser did not open */}
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

      {/* Line endings — windows only */}
      {os === 'windows' && (
        <TroubleshootRow
          title='"LF will be replaced by CRLF" warnings'
          cause="Git is converting Unix line endings to Windows-style on checkout."
          isOpen={openId === 'ts-08'}
          onToggle={() => toggle('ts-08')}
        >
          <CliCodeBlock code={`git config --global core.autocrlf input`} />
          <p className={styles.hint}>
            These warnings are cosmetic and do not affect submission results. Run the command above
            once to suppress them globally.
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

// ── Email template ────────────────────────────────────────────────────────────
function EmailTemplate({
  apiBaseUrl,
  projectKey = 'cs101/assignment-1',
}: {
  apiBaseUrl: string | null;
  projectKey?: string;
}) {
  const [copied, setCopied] = useState(false);

  const subject = `Getting started with Nibras CLI – ${projectKey}`;
  const body = [
    'Hi everyone,',
    '',
    "To submit your assignments, you'll use the Nibras CLI tool. Here's how to get started:",
    '',
    '1. Install the CLI:',
    '   npm install -g https://github.com/NibrasPlatform/nibras-cli/releases/download/v1.0.2/nibras-cli-1.0.2.tgz',
    '',
    '2. Log in with your GitHub account:',
    `   nibras login --api-base-url ${apiBaseUrl ?? '<api-url>'}`,
    '',
    '3. Set up the project:',
    `   nibras setup --project ${projectKey}`,
    '',
    '4. View the task instructions:',
    '   nibras task',
    '',
    '5. Run tests locally:',
    '   nibras test',
    '',
    '6. Submit your work:',
    '   nibras submit',
    '',
    'If you run into any issues, run `nibras ping` and share the output with me.',
    '',
    'Good luck!',
  ].join('\n');

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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [os, setOs] = useState<OS>('mac');
  const [windowsShell, setWindowsShell] = useState<WindowsShell>('powershell');
  const [activeStep, setActiveStep] = useState('step-01');
  const [completion, setCompletion] = useState<CompletionState>({});
  const [hostedApiBaseUrl, setHostedApiBaseUrl] = useState<string | null>(null);
  const [apiDiscoveryState, setApiDiscoveryState] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [apiDiscoveryError, setApiDiscoveryError] = useState<string | null>(null);

  // Load OS + completion on mount
  useEffect(() => {
    const saved = prefs.getOnboardingOs() as OS | null;
    setOs(saved ?? detectOS());
    setCompletion(loadCompletion());
  }, []);

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
      saveCompletion(next);
      return next;
    });
  }

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
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Derived values
  const completedCount = Object.values(completion).filter(Boolean).length;
  const progressPct = Math.round((completedCount / TOTAL_STEPS) * 100);
  const allDone = completedCount === TOTAL_STEPS;

  const configPath = getOnboardingConfigPath(os);
  const dirExample = getOnboardingDirExample(os, windowsShell);
  const loginCommand = hostedApiBaseUrl ? buildHostedLoginCommand(hostedApiBaseUrl) : null;
  const studentQuickStart = hostedApiBaseUrl ? buildStudentQuickStart(hostedApiBaseUrl) : null;
  const installTroubleshootingCommand = getInstallTroubleshootingCommand(os, windowsShell);

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
    { type: 'success', text: '│  ✓  Authenticated as Zied               │' },
    { type: 'muted', text: '│  User:    Zied                          │' },
    { type: 'muted', text: '│  GitHub:  Zied                          │' },
    {
      type: 'muted',
      text: `│  API:     ${(hostedApiBaseUrl ?? 'https://api.example.com').slice(0, 28).padEnd(28)} │`,
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
          <div className={styles.heroTopRow}>
            <div className={styles.heroBadge}>
              {allDone ? '🎉 Setup complete' : 'CLI Setup Guide'}
            </div>
            {completedCount > 0 && !allDone && (
              <div className={styles.heroProgressPill}>
                {completedCount}/{TOTAL_STEPS} steps done
              </div>
            )}
          </div>
          <h1 className={styles.heroTitle}>
            {allDone ? "You're all set" : 'Get the Nibras CLI running'}
          </h1>
          <p className={styles.heroSub}>
            {allDone
              ? "The CLI is installed, you're authenticated, and the project is set up. Head to the instructor dashboard to manage courses and review submissions."
              : 'Install the CLI, authenticate with GitHub, create a project, and make your first submission — step by step, for your OS.'}
          </p>
          {/* Outcome chips */}
          {!allDone && (
            <div className={styles.heroOutcomes}>
              <span className={styles.heroOutcomeChip}>✓ Students submit via CLI</span>
              <span className={styles.heroOutcomeChip}>✓ Auto-verified results</span>
              <span className={styles.heroOutcomeChip}>✓ Full instructor dashboard</span>
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
          <div className={styles.heroActions}>
            <Link href="/instructor/courses/new" className={styles.btnPrimary}>
              {allDone ? 'Go to dashboard →' : 'Create a course first →'}
            </Link>
            <a
              href="https://github.com/nibras-platform/nibras-cli"
              target="_blank"
              rel="noreferrer"
              className={styles.btnGhost}
            >
              GitHub →
            </a>
          </div>
        </div>

        <FlowOverview />

        <div className={styles.content}>
          {/* ── 01 Prerequisites ──────────────────────────────────────────── */}
          <Section
            id="step-01"
            number="01"
            title="Prerequisites"
            completed={!!completion['step-01']}
            onToggleComplete={() => toggleStep('step-01')}
          >
            <p className={styles.bodyText}>
              You need <strong>Node.js ≥ 18</strong>, <strong>npm ≥ 9</strong>, and{' '}
              <strong>git</strong> before installing the CLI. Follow the steps for your OS.
            </p>
            <VideoPlaceholder title="Installing Node.js, npm, and Git" youtubeId="EPtpi7PvtII" />

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
            number="02"
            title="Install the CLI"
            completed={!!completion['step-02']}
            onToggleComplete={() => toggleStep('step-02')}
          >
            <p className={styles.bodyText}>
              Install the current CLI release ({PINNED_RELEASE_TAG}) directly from the GitHub
              release. This makes the <code className={styles.inlineCode}>nibras</code> command
              available everywhere in your terminal.
            </p>
            <VideoPlaceholder title="Installing the Nibras CLI" />

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

            <OsCode
              os={os}
              mac={NPM_INSTALL_COMMAND}
              linux={NPM_INSTALL_COMMAND}
              windows={NPM_INSTALL_COMMAND}
            />
            <p className={styles.hint}>
              This installs directly from the tagged GitHub release — no npm registry required.
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
            number="03"
            title="Authenticate with GitHub"
            completed={!!completion['step-03']}
            onToggleComplete={() => toggleStep('step-03')}
          >
            <p className={styles.bodyText}>
              Use an explicit <code className={styles.inlineCode}>--api-base-url</code> for hosted
              onboarding so the CLI targets this deployment instead of the local dev default at{' '}
              <code className={styles.inlineCode}>http://127.0.0.1:4848</code>. The login flow
              prints a one-time URL and short code, then tries to open the browser automatically
              unless you pass <code className={styles.inlineCode}>--no-open</code>.
            </p>
            <VideoPlaceholder title="GitHub OAuth authentication flow" />
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
            {apiDiscoveryState === 'ready' && loginCommand ? (
              <>
                <CliCodeBlock code={loginCommand} />
                <div className={styles.terminalWrapper}>
                  <TerminalMockup title="nibras login" lines={loginOutput} />
                </div>
              </>
            ) : (
              <div className={`${styles.callout} ${styles.calloutInfo}`}>
                <span className={styles.calloutIcon}>ℹ</span>
                <p>
                  {apiDiscoveryState === 'loading'
                    ? 'Checking which API this deployment uses before rendering the hosted login command…'
                    : (apiDiscoveryError ??
                      'Unable to verify a reachable API. Ask your admin for the hosted API URL and use `nibras login --api-base-url <url>`.')}
                </p>
              </div>
            )}
            <p className={styles.hint}>
              Credentials are saved in <code className={styles.inlineCode}>{configPath}</code>. Run{' '}
              <code className={styles.inlineCode}>nibras whoami</code> after login to confirm the
              active session and linked GitHub account.
            </p>
          </Section>

          {/* ── 04 Create a course ─────────────────────────────────────────── */}
          <Section
            id="step-04"
            number="04"
            title="Create a course (web)"
            completed={!!completion['step-04']}
            onToggleComplete={() => toggleStep('step-04')}
          >
            <p className={styles.bodyText}>
              Before students can use the CLI, create a course and at least one project from the web
              dashboard.
            </p>
            <ol className={styles.steps}>
              <li>
                Go to <strong>Instructor → New Course</strong>
              </li>
              <li>
                Enter the course code (e.g. <code className={styles.inlineCode}>cs101</code>),
                title, and term
              </li>
              <li>Add a project with an allowed file path pattern</li>
              <li>
                Copy the project key (e.g.{' '}
                <code className={styles.inlineCode}>cs101/assignment-1</code>)
              </li>
            </ol>
            <Link href="/instructor/courses/new" className={styles.btnPrimary}>
              Open course creator →
            </Link>
          </Section>

          {/* ── 05 Setup ───────────────────────────────────────────────────── */}
          <Section
            id="step-05"
            number="05"
            title="Set up a project locally"
            completed={!!completion['step-05']}
            onToggleComplete={() => toggleStep('step-05')}
          >
            <p className={styles.bodyText}>
              Run <code className={styles.inlineCode}>nibras setup</code> with the project key to
              bootstrap the local directory. It writes{' '}
              <code className={styles.inlineCode}>.nibras/project.json</code> and{' '}
              <code className={styles.inlineCode}>.nibras/task.md</code>, initialises git if needed,
              and adds <code className={styles.inlineCode}>origin</code> for the student repo.
            </p>
            <VideoPlaceholder title="Running nibras setup for a project" />
            <CliCodeBlock code="nibras setup --project cs101/assignment-1" />
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
            number="06"
            title="Run local tests"
            completed={!!completion['step-06']}
            onToggleComplete={() => toggleStep('step-06')}
          >
            <p className={styles.bodyText}>
              Use <code className={styles.inlineCode}>nibras test</code> to run the
              manifest-configured test command for your OS. Pass{' '}
              <code className={styles.inlineCode}>--previous</code> only when the project manifest
              supports it.
            </p>
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
            number="07"
            title="Submit your solution"
            completed={!!completion['step-07']}
            onToggleComplete={() => toggleStep('step-07')}
          >
            <p className={styles.bodyText}>
              <code className={styles.inlineCode}>nibras submit</code> runs the configured local
              test command, stages only allowed files, creates a commit, pushes to{' '}
              <code className={styles.inlineCode}>origin</code>, registers the submission, and polls
              for server-side verification.
            </p>
            <VideoPlaceholder title="Submitting your first solution" />
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
            number="08"
            title="Check status"
            completed={!!completion['step-08']}
            onToggleComplete={() => toggleStep('step-08')}
          >
            <p className={styles.bodyText}>Two diagnostic commands are available at any time:</p>
            <CliCodeBlock
              code={`nibras ping    # check API, auth, GitHub, GitHub App, and project status\nnibras whoami  # show signed-in user and linked GitHub account`}
            />
            <p className={styles.hint}>
              <code className={styles.inlineCode}>nibras ping</code> is the fastest way to diagnose
              any problem — run it first. When run inside a project directory it also shows the
              project key and <code className={styles.inlineCode}>origin</code> remote.
            </p>
          </Section>

          {/* ── 09 Share ───────────────────────────────────────────────────── */}
          <Section
            id="step-09"
            number="09"
            title="Share with students"
            completed={!!completion['step-09']}
            onToggleComplete={() => toggleStep('step-09')}
          >
            <p className={styles.bodyText}>
              Students follow the same flow: install the CLI, run{' '}
              <code className={styles.inlineCode}>nibras login --api-base-url &lt;api-url&gt;</code>
              , and <code className={styles.inlineCode}>nibras setup --project &lt;key&gt;</code>.
              Share the project key with your class.
            </p>

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
            <EmailTemplate apiBaseUrl={hostedApiBaseUrl} />
            <p className={styles.hint}>
              Students can view assignment instructions at any time with{' '}
              <code className={styles.inlineCode}>nibras task</code>.
            </p>
          </Section>

          {/* ── 10 Troubleshooting ─────────────────────────────────────────── */}
          <Section
            id="step-10"
            number="10"
            title="Troubleshooting"
            completed={!!completion['step-10']}
            onToggleComplete={() => toggleStep('step-10')}
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
                  href="https://github.com/nibras-platform/nibras-cli/issues"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  github.com/nibras-platform/nibras-cli
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
              {COMMAND_REFERENCE_GROUPS.map((group) => (
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
                  The CLI is installed, you&apos;re authenticated, and you&apos;ve walked through
                  every step. Head to the dashboard to manage your courses and review submissions.
                </p>
              </>
            ) : (
              <>
                <h3>Ready to create your first course?</h3>
                <p>
                  Set up a course and project on the web, then share the project key with students.
                </p>
              </>
            )}
            <div className={styles.footerCtaActions}>
              <Link href="/instructor/courses/new" className={styles.btnPrimary}>
                {allDone ? 'Go to instructor dashboard →' : 'Create a course →'}
              </Link>
              <Link href="/instructor" className={styles.btnGhost}>
                Back to Instructor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
