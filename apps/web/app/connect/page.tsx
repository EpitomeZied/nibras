'use client';

import Link from 'next/link';
import { useState } from 'react';
import { discoverApiBaseUrl } from '../lib/session';
import styles from './page.module.css';

export default function ConnectDashboardPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setSubmitting(true);
    setError(null);
    try {
      const apiBaseUrl = await discoverApiBaseUrl();
      const returnTo = `${window.location.origin}/auth/complete`;
      window.location.href = `${apiBaseUrl}/v1/github/oauth/start?return_to=${encodeURIComponent(returnTo)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

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
            Sign in with your GitHub account to unlock Community, Competitions,
            Achievements, and all dashboard features.
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

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className={styles.submit}
          disabled={submitting}
          onClick={handleSignIn}
        >
          {submitting ? 'Redirecting…' : 'Sign in with GitHub'}
        </button>

        <footer className={styles.footer}>
          <p>
            <Link href="/">← Back to main sign-in</Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
