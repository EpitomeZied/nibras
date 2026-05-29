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
              <span className={styles.termPrompt}>nibras</span>
              <span className={styles.termCmd}> login</span>
            </div>
            <p className={styles.signInTermHelp}>
              Use GitHub or a one-time email link. Magic-link sign-in works for the web dashboard;
              connect GitHub later for CLI submissions.
            </p>

            <div className={styles.signInAuthPanel}>
              <AuthSignIn
                githubClassName={styles.btnHeroPrimary}
                magicLinkClassName={styles.btnMagicLink}
                emailInputClassName={styles.magicLinkEmail}
                errorClassName={styles.errorMsg}
                noticeClassName={styles.authNotice}
                githubLabel="Continue with GitHub"
                magicLinkLabel="Email me a sign-in link"
              />
            </div>
          </div>
        </div>

        <p className={styles.signInFootnote}>
          <span className={styles.termMuted}>hint:</span> run{' '}
          <code className={styles.signInFootnoteCode}>nibras login</code> for CLI device flow
        </p>
      </div>
    </main>
  );
}
