'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthSignIn from '../_components/auth-sign-in';
import { signOutWebSession } from '../lib/sign-out';
import styles from './page.module.css';

export default function ConnectDashboardPage() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    try {
      setHasSession(Boolean(window.localStorage.getItem('nibras.webSession')));
    } catch {
      setHasSession(false);
    }
  }, []);

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
            <button type="button" onClick={() => void signOutWebSession()}>
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
