'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import type { AuthProvidersConfig } from '@/lib/auth-providers-server';
import { getUnavailableSignInMessage } from '@/lib/auth-providers-server';
import { authClient } from '@/lib/auth-client';
import { webSessionBridgePath } from '@/lib/web-session-cookie';

export type AuthProviders = AuthProvidersConfig;

type AuthSignInProps = {
  variant?: 'default' | 'terminal';
  initialProviders?: AuthProviders;
  githubClassName?: string;
  magicLinkClassName?: string;
  emailInputClassName?: string;
  errorClassName?: string;
  noticeClassName?: string;
  unavailableClassName?: string;
  githubLabel?: string;
  magicLinkLabel?: string;
  compact?: boolean;
  bridgeNext?: string;
};

const DEFAULT_PROVIDERS: AuthProviders = {
  github: true,
  magicLink: true,
};

function normalizeProviders(body: Partial<AuthProviders> | null | undefined): AuthProviders {
  return {
    github: body?.github ?? false,
    magicLink: body?.magicLink ?? false,
  };
}

export default function AuthSignIn({
  variant = 'default',
  initialProviders,
  githubClassName = '',
  magicLinkClassName = '',
  emailInputClassName = '',
  errorClassName = '',
  noticeClassName = '',
  unavailableClassName = '',
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
  const [providers, setProviders] = useState<AuthProviders>(
    () => initialProviders ?? DEFAULT_PROVIDERS
  );

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/auth/providers-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: AuthProviders | null) => {
        if (cancelled || !body) return;
        setProviders(normalizeProviders(body));
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
  const noProviders = !providers.github && !providers.magicLink;

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

  const unavailableMessage = getUnavailableSignInMessage(process.env.NODE_ENV === 'production');

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
      {noProviders ? (
        <p
          className={unavailableClassName}
          role="status"
          style={
            unavailableClassName
              ? undefined
              : {
                  margin: 0,
                  fontSize: isTerminal ? 12 : 14,
                  lineHeight: 1.6,
                  color: isTerminal ? 'rgba(161, 161, 170, 0.85)' : 'rgba(161, 161, 170, 0.9)',
                  fontFamily: isTerminal ? 'var(--font-mono, monospace)' : undefined,
                }
          }
        >
          {isTerminal ? `# ${unavailableMessage}` : unavailableMessage}
        </p>
      ) : null}

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
