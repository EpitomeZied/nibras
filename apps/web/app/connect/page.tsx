'use client';

import Link from 'next/link';
import AuthSignIn from '../_components/auth-sign-in';
import styles from './page.module.css';

export default function ConnectDashboardPage() {
  function disconnect() {
    try {
      window.localStorage.removeItem('nibras.webSession');
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('nibras.dashboardUser');
    } catch {
      /* ignore */
    }
    window.location.reload();
  }

  const hasSession =
    typeof window !== 'undefined' &&
    Boolean(
      (() => {
        try {
          return window.localStorage.getItem('nibras.webSession');
        } catch {
          return null;
        }
      })()
    );

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Connect to Nibras</h1>
          <p className={styles.subtitle}>
            Sign in with GitHub or a magic link to unlock Community, Competitions, Achievements, and
            all dashboard features.
          </p>
        </header>

        {hasSession && (
          <div className={styles.notice}>
            You&apos;re already connected.{' '}
            <button type="button" onClick={disconnect}>
              Disconnect
            </button>{' '}
            if you want to sign in as a different account.
          </div>
        )}

        <AuthSignIn
          githubClassName={styles.submit}
          magicLinkClassName={styles.submitSecondary}
          emailInputClassName={styles.input}
          errorClassName={styles.error}
          noticeClassName={styles.noticeSuccess}
          githubLabel="Sign in with GitHub"
          compact
        />

        <footer className={styles.footer}>
          <p>
            <Link href="/">← Back to main sign-in</Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
