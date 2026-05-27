'use client';

import { useState, type FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';
import { webSessionBridgePath } from '@/lib/web-session-cookie';

type AuthSignInProps = {
  githubClassName?: string;
  magicLinkClassName?: string;
  emailInputClassName?: string;
  errorClassName?: string;
  noticeClassName?: string;
  githubLabel?: string;
  compact?: boolean;
};

export default function AuthSignIn({
  githubClassName = '',
  magicLinkClassName = '',
  emailInputClassName = '',
  errorClassName = '',
  noticeClassName = '',
  githubLabel = 'Continue with GitHub',
  compact = false,
}: AuthSignInProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [githubSubmitting, setGithubSubmitting] = useState(false);
  const [magicSubmitting, setMagicSubmitting] = useState(false);

  const bridgeCallback =
    typeof window !== 'undefined'
      ? `${window.location.origin}${webSessionBridgePath()}`
      : webSessionBridgePath();

  async function handleGitHub() {
    setError('');
    setNotice('');
    setGithubSubmitting(true);
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: bridgeCallback,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setGithubSubmitting(false);
    }
  }

  async function handleMagicLink(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email address.');
      return;
    }
    setMagicSubmitting(true);
    try {
      const { error: magicError } = await authClient.signIn.magicLink({
        email: trimmed,
        callbackURL: bridgeCallback,
      });
      if (magicError) {
        throw new Error(magicError.message ?? 'Could not send magic link.');
      }
      setNotice('Check your email for a sign-in link. It expires in a few minutes.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setMagicSubmitting(false);
    }
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 14, width: '100%' }}
    >
      <button
        type="button"
        className={githubClassName}
        disabled={githubSubmitting || magicSubmitting}
        onClick={() => void handleGitHub()}
      >
        {githubSubmitting ? 'Redirecting…' : githubLabel}
      </button>

      {!compact ? (
        <p
          style={{ margin: 0, fontSize: 12, color: 'rgba(161,161,170,0.85)', textAlign: 'center' }}
        >
          or sign in with email
        </p>
      ) : null}

      <form
        onSubmit={(e) => void handleMagicLink(e)}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={emailInputClassName}
          disabled={githubSubmitting || magicSubmitting}
          required
        />
        <button
          type="submit"
          className={magicLinkClassName}
          disabled={githubSubmitting || magicSubmitting}
        >
          {magicSubmitting ? 'Sending link…' : 'Email me a sign-in link'}
        </button>
      </form>

      {error ? (
        <p className={errorClassName} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className={noticeClassName} role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
