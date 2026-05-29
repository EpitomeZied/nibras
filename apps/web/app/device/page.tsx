'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthSignIn from '../_components/auth-sign-in';
import { apiFetch } from '../lib/session';
import styles from './page.module.css';

type SessionUser = {
  username: string;
  githubLogin: string;
};

function DeviceApprovalContent() {
  const searchParams = useSearchParams();
  const userCode = searchParams.get('user_code') ?? '';

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch('/v1/web/session', { auth: true });
        if (res.ok) {
          const data = (await res.json()) as { user: SessionUser };
          setSessionUser(data.user);
        }
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  async function handleApprove() {
    setSubmitting(true);
    setStatus('');
    try {
      const res = await apiFetch('/v1/device/authorize', {
        method: 'POST',
        auth: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userCode }),
      });
      if (res.ok) {
        setApproved(true);
        setStatus('Login approved! You can close this tab and return to your terminal.');
      } else {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setStatus(err.message ?? 'Authorization failed. Please try again.');
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const returnTo = `/device${userCode ? `?user_code=${encodeURIComponent(userCode)}` : ''}`;
  const legacySignInUrl = `/v1/github/oauth/start?return_to=${encodeURIComponent(returnTo)}`;

  if (checking) {
    return (
      <main className={styles.page}>
        <div className={`${styles.card} surfaceCard`}>
          <p className={styles.muted}>Checking session…</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>CLI Authentication</span>
        <h1 className={styles.title}>Authorize Terminal Login</h1>
        <p className={styles.subtitle}>
          A terminal session is requesting access to your Nibras account.
        </p>
      </div>

      <div className={`${styles.card} surfaceCard`}>
        {userCode && (
          <div className={styles.codeBlock}>
            <span className={styles.codeLabel}>Your confirmation code</span>
            <code className={styles.code}>{userCode}</code>
            <span className={styles.codeHint}>
              Make sure this matches the code shown in your terminal.
            </span>
          </div>
        )}

        {!sessionUser ? (
          <div className={styles.section}>
            <p className={styles.muted}>Sign in to approve this login request.</p>
            <div className={styles.signInOptions}>
              <AuthSignIn
                compact
                bridgeNext={returnTo}
                githubClassName={`buttonPrimary ${styles.signInBtn}`}
                magicLinkClassName={`buttonSecondary ${styles.signInBtn}`}
                emailInputClassName={styles.emailInput}
                errorClassName={styles.error}
                noticeClassName={styles.muted}
                githubLabel="Sign in with GitHub"
              />
            </div>
            <p className={styles.muted} style={{ marginTop: 12, fontSize: 12 }}>
              Or use{' '}
              <a href={legacySignInUrl} className={styles.legacyLink}>
                legacy GitHub App OAuth
              </a>
            </p>
          </div>
        ) : approved ? (
          <div className={styles.success}>
            <span className={styles.successIcon}>✓</span>
            <div>
              <strong>Login approved!</strong>
              <p>You can close this tab and return to your terminal.</p>
            </div>
          </div>
        ) : (
          <div className={styles.section}>
            <p className={styles.muted}>
              Signed in as <strong>@{sessionUser.githubLogin || sessionUser.username}</strong>
            </p>
            {status && <p className={styles.error}>{status}</p>}
            <div className={styles.actions}>
              <button
                className="buttonPrimary"
                onClick={handleApprove}
                disabled={submitting || !userCode}
              >
                {submitting ? 'Approving…' : 'Approve Login'}
              </button>
              <a href="/dashboard" className="buttonSecondary">
                Cancel
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DevicePage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <p>Loading…</p>
        </main>
      }
    >
      <DeviceApprovalContent />
    </Suspense>
  );
}
