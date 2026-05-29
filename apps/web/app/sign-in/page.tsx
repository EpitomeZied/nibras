import type { Metadata } from 'next';
import Link from 'next/link';
import AuthSignIn from '../_components/auth-sign-in';
import styles from '../signin.module.css';

export const metadata: Metadata = {
  title: 'Sign in · Nibras',
  description:
    'Sign in to Nibras with GitHub, or use a magic link sent to your email for the web dashboard.',
};

export default function SignInPage() {
  return (
    <main className={`${styles.page} ${styles.signInPage}`}>
      <div className={styles.grid} />
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />

      <div className={styles.signInShell}>
        <Link href="/" className={styles.signInHomeCmd} aria-label="Back to home">
          <span className={styles.termPrompt}>~</span>
          <span className={styles.termCmd}> cd /</span>
          <span className={styles.termMuted}> — return home</span>
        </Link>

        <div className={`${styles.terminalWindow} ${styles.signInTerminal}`}>
          <div className={styles.terminalTitleBar}>
            <span className={styles.termDot} style={{ background: '#ff5f57' }} />
            <span className={styles.termDot} style={{ background: '#febc2e' }} />
            <span className={styles.termDot} style={{ background: '#28c840' }} />
            <span className={styles.termTitle}>nibras — auth</span>
          </div>

          <div className={`${styles.terminalBody} ${styles.signInTerminalBody}`}>
            <div className={styles.termLine}>
              <span className={styles.termMuted}>Nibras session manager v2.0</span>
            </div>
            <div className={styles.termLine}>
              <span className={styles.termSuccess}>✓</span>
              <span className={styles.termMuted}> API reachable</span>
            </div>
            <div className={styles.termLine}>
              <span className={styles.termHighlight}>→</span>
              <span className={styles.termCmd}> authenticate to continue</span>
            </div>
            <div className={styles.termLine} aria-hidden="true">
              <span className={styles.termMuted}> </span>
            </div>
            <div className={styles.termLine}>
              <span className={styles.termPrompt}>login</span>
              <span className={styles.termCmd}> --help</span>
            </div>
            <p className={styles.signInTermHelp}>
              Use GitHub or a one-time email link. Magic-link sign-in works for the web dashboard;
              connect GitHub later for CLI submissions.
            </p>

            <AuthSignIn
              variant="terminal"
              githubClassName={styles.termAuthBtn}
              magicLinkClassName={styles.termAuthBtnGhost}
              emailInputClassName={styles.termEmailInput}
              errorClassName={styles.termAuthError}
              noticeClassName={styles.termAuthNotice}
              githubLabel="Continue with GitHub"
              magicLinkLabel="Email me a sign-in link"
            />
          </div>
        </div>

        <p className={styles.signInFootnote}>
          <span className={styles.termMuted}>hint:</span> run{' '}
          <code className={styles.signInFootnoteCode}>nibras login</code> from your project for CLI
          device flow
        </p>
      </div>
    </main>
  );
}
