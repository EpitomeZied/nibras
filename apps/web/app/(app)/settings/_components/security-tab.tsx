'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';
import styles from '../page.module.css';

const MIN_PASSWORD_LENGTH = 8;

function IconKey() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

export default function SecurityTab() {
  const [providers, setProviders] = useState<string[] | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasCredential = providers?.includes('credential') ?? false;

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/auth/linked-providers')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { providers?: string[] } | null) => {
        if (cancelled || !body) return;
        setProviders(Array.isArray(body.providers) ? body.providers : []);
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function validatePasswordPair(password: string, confirm: string): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirm) {
      return 'Passwords do not match.';
    }
    return null;
  }

  async function handleSetPassword(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const validationError = validatePasswordPair(newPassword, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? 'Could not set password.');
      }
      setNewPassword('');
      setConfirmPassword('');
      setProviders((prev) => (prev ? [...new Set([...prev, 'credential'])] : ['credential']));
      setNotice('Password set. You can now sign in with your email and password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const validationError = validatePasswordPair(newPassword, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: changeError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (changeError) {
        throw new Error(changeError.message ?? 'Could not change password.');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.contentSection}>
      <h2 className={styles.sectionHeading}>Security</h2>
      <p className={styles.sectionSub}>Manage your security settings</p>

      <div className={styles.securityCard}>
        <span className={styles.securityCardIcon}>
          <IconKey />
        </span>
        <div className={styles.securityCardBody}>
          <strong className={styles.securityCardTitle}>Password</strong>
          {providers === null ? (
            <p className={styles.securityCardMessage}>Loading…</p>
          ) : hasCredential ? (
            <>
              <p className={styles.securityCardMessage}>
                Change your password. You can sign in with email and password or a magic link.
              </p>
              <form className={styles.securityForm} onSubmit={(e) => void handleChangePassword(e)}>
                <label className={styles.securityField}>
                  <span className={styles.securityLabel}>Current password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.securityInput}
                    disabled={submitting}
                    required
                  />
                </label>
                <label className={styles.securityField}>
                  <span className={styles.securityLabel}>New password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.securityInput}
                    disabled={submitting}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                </label>
                <label className={styles.securityField}>
                  <span className={styles.securityLabel}>Confirm new password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.securityInput}
                    disabled={submitting}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                </label>
                <button type="submit" className={styles.securitySubmit} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Change password'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className={styles.securityCardMessage}>
                Set a password to sign in with email and password in addition to magic link or
                GitHub.
              </p>
              <form className={styles.securityForm} onSubmit={(e) => void handleSetPassword(e)}>
                <label className={styles.securityField}>
                  <span className={styles.securityLabel}>New password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.securityInput}
                    disabled={submitting}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                </label>
                <label className={styles.securityField}>
                  <span className={styles.securityLabel}>Confirm password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.securityInput}
                    disabled={submitting}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                </label>
                <button type="submit" className={styles.securitySubmit} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Set password'}
                </button>
              </form>
            </>
          )}
          {error ? (
            <p className={styles.securityError} role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className={styles.securityNotice} role="status">
              {notice}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
