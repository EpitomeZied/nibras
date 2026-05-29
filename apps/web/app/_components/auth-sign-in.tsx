'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';
import { webSessionBridgePath } from '@/lib/web-session-cookie';

type AuthProviders = {
  github: boolean;
  magicLink: boolean;
};

type AuthSignInProps = {
  variant?: 'default' | 'terminal';
  githubClassName?: string;
  magicLinkClassName?: string;
  emailInputClassName?: string;
  errorClassName?: string;
  noticeClassName?: string;
  githubLabel?: string;
  magicLinkLabel?: string;
  compact?: boolean;
  bridgeNext?: string;
};

const DEFAULT_PROVIDERS: AuthProviders = {
  github: true,
  magicLink: true,
};

export default function AuthSignIn({
  variant = 'default',
  githubClassName = '',
  magicLinkClassName = '',
  emailInputClassName = '',
  errorClassName = '',
  noticeClassName = '',
  githubLabel,
  magicLinkLabel,
  compact = false,
  bridgeNext,
}: AuthSignInProps) {
  const isTerminal = variant === 'terminal';
  const resolvedGithubLabel = githubLabel ?? 'Continue with GitHub';
  const resolvedMagicLabel = magicLinkLabel ?? 'Email me a sign-in link';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [githubSubmitting, setGithubSubmitting] = useState(false);
  const [magicSubmitting, setMagicSubmitting] = useState(false);
  const [providers, setProviders] = useState<AuthProviders>(DEFAULT_PROVIDERS);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/auth/providers-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: AuthProviders | null) => {
        if (cancelled || !body) return;
        setProviders({
          github: body.github ?? DEFAULT_PROVIDERS.github,
          magicLink: body.magicLink ?? true,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function buildBridgeCallback(): string {
    const base =
      typeof window !== 'undefined'
        ? `${window.location.origin}${webSessionBridgePath()}`
        : webSessionBridgePath();
    if (!bridgeNext) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}next=${encodeURIComponent(bridgeNext)}`;
  }

  const socialBusy = githubSubmitting || magicSubmitting;

  async function handleGitHub() {
    setError('');
    setNotice('');
    setGithubSubmitting(true);
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: buildBridgeCallback(),
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
        callbackURL: buildBridgeCallback(),
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 12 : isTerminal ? 10 : 14,
        width: '100%',
        marginTop: isTerminal ? 4 : 0,
      }}
    >
      {providers.github ? (
        <button
          type="button"
          className={githubClassName}
          disabled={socialBusy}
          onClick={() => void handleGitHub()}
        >
          {githubSubmitting ? (isTerminal ? 'redirecting…' : 'Redirecting…') : resolvedGithubLabel}
        </button>
      ) : null}

      {!compact && providers.magicLink ? (
        isTerminal ? (
          <p style={termCommentStyle}># or sign in with email</p>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'rgba(161,161,170,0.85)',
              textAlign: 'center',
            }}
          >
            or sign in with email
          </p>
        )
      ) : null}

      {providers.magicLink ? (
        <form
          onSubmit={(e) => void handleMagicLink(e)}
          style={{ display: 'flex', flexDirection: 'column', gap: isTerminal ? 8 : 10 }}
        >
          {isTerminal ? (
            <label style={termEmailRowStyle}>
              <span style={termEmailPromptStyle}>$</span>
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
            </label>
          ) : (
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
          )}
          <button type="submit" className={magicLinkClassName} disabled={socialBusy}>
            {magicSubmitting ? (isTerminal ? 'sending…' : 'Sending link…') : resolvedMagicLabel}
          </button>
        </form>
      ) : null}

      {error ? (
        <p className={errorClassName} role="alert">
          {isTerminal ? `error: ${error}` : error}
        </p>
      ) : null}
      {notice ? (
        <p className={noticeClassName} role="status">
          {isTerminal ? `ok: ${notice}` : notice}
        </p>
      ) : null}
    </div>
  );
}

const termCommentStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 12,
  color: 'rgba(161, 161, 170, 0.55)',
};

const termEmailRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
};

const termEmailPromptStyle: CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 14,
  fontWeight: 700,
  color: '#4ade80',
  flexShrink: 0,
};
