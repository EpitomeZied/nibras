'use client';

import { useState, type FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';
import { googleAuthEnabled } from '@/lib/auth-providers';
import { webSessionBridgePath } from '@/lib/web-session-cookie';

type AuthSignInProps = {
  githubClassName?: string;
  googleClassName?: string;
  magicLinkClassName?: string;
  emailInputClassName?: string;
  errorClassName?: string;
  noticeClassName?: string;
  githubLabel?: string;
  googleLabel?: string;
  compact?: boolean;
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AuthSignIn({
  githubClassName = '',
  googleClassName = '',
  magicLinkClassName = '',
  emailInputClassName = '',
  errorClassName = '',
  noticeClassName = '',
  githubLabel = 'Continue with GitHub',
  googleLabel = 'Continue with Google',
  compact = false,
}: AuthSignInProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [githubSubmitting, setGithubSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [magicSubmitting, setMagicSubmitting] = useState(false);

  const bridgeCallback =
    typeof window !== 'undefined'
      ? `${window.location.origin}${webSessionBridgePath()}`
      : webSessionBridgePath();

  const socialBusy = githubSubmitting || googleSubmitting || magicSubmitting;

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

  async function handleGoogle() {
    setError('');
    setNotice('');
    setGoogleSubmitting(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: bridgeCallback,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setGoogleSubmitting(false);
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
      {googleAuthEnabled ? (
        <button
          type="button"
          className={googleClassName || githubClassName}
          disabled={socialBusy}
          onClick={() => void handleGoogle()}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <GoogleIcon />
            {googleSubmitting ? 'Redirecting…' : googleLabel}
          </span>
        </button>
      ) : null}

      <button
        type="button"
        className={githubClassName}
        disabled={socialBusy}
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
          disabled={socialBusy}
          required
        />
        <button type="submit" className={magicLinkClassName} disabled={socialBusy}>
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
