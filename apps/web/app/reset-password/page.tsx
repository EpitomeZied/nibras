'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';
import styles from '../signin.module.css';

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const urlError = searchParams.get('error');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!token) {
      setError('Reset link is invalid or missing.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword,
        token,
      });
      if (resetError) {
        throw new Error(resetError.message ?? 'Could not reset password.');
      }
      setDone(true);
      setNotice('Password updated. You can now sign in with your email and password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (urlError === 'INVALID_TOKEN' || (!token && !done)) {
    return (
      <div className={styles.signInShell}>
        <div className={`${styles.terminalWindow} ${styles.signInTerminal}`}>
          <div className={styles.terminalBody}>
            <p className={styles.termAuthError} role="alert">
              This reset link is invalid or has expired.
            </p>
            <Link href="/sign-in" className={styles.termAuthBtnGhost}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.signInShell}>
        <div className={`${styles.terminalWindow} ${styles.signInTerminal}`}>
          <div className={styles.terminalBody}>
            <p className={styles.termAuthNotice} role="status">
              {notice}
            </p>
            <Link href="/sign-in" className={styles.termAuthBtn}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signInShell}>
      <div className={`${styles.terminalWindow} ${styles.signInTerminal}`}>
        <div className={styles.terminalTitleBar}>
          <span className={styles.termDot} style={{ background: '#ff5f57' }} />
          <span className={styles.termDot} style={{ background: '#febc2e' }} />
          <span className={styles.termDot} style={{ background: '#28c840' }} />
          <span className={styles.termTitle}>nibras — reset password</span>
        </div>
        <div className={`${styles.terminalBody} ${styles.signInTerminalBody}`}>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={styles.termPrompt}>#</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.termEmailInput}
                disabled={submitting}
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={styles.termPrompt}>#</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.termEmailInput}
                disabled={submitting}
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </label>
            <button type="submit" className={styles.termAuthBtn} disabled={submitting}>
              {submitting ? 'Saving…' : 'Set new password'}
            </button>
          </form>
          {error ? (
            <p className={styles.termAuthError} role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className={`${styles.page} ${styles.signInPage}`}>
      <div className={styles.grid} />
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
