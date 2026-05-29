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
  emailPassword: true,
};

function normalizeProviders(body: Partial<AuthProviders> | null | undefined): AuthProviders {
  return {
    github: body?.github ?? false,
    magicLink: body?.magicLink ?? false,
    emailPassword: body?.emailPassword ?? true,
  };
}

function passwordSignInErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('invalid') ||
    lower.includes('incorrect') ||
    lower.includes('not found') ||
    lower.includes('credential')
  ) {
    return 'Invalid email or password. If you signed in with a magic link, set a password in Settings first.';
  }
  return message;
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
  const [password, setPassword] = useState('');
  const [emailMode, setEmailMode] = useState<'magic' | 'password'>('magic');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [githubSubmitting, setGithubSubmitting] = useState(false);
  const [magicSubmitting, setMagicSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
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

  const socialBusy = githubSubmitting || magicSubmitting || passwordSubmitting || forgotSubmitting;
  const noProviders = !providers.github && !providers.magicLink && !providers.emailPassword;
  const showEmailSection = providers.magicLink || providers.emailPassword;

  async function handleGitHub() {
    setError('');
    setNotice('');
    setGithubSubmitting(true);
    try {
      const { data, error: socialError } = await authClient.signIn.social({
        provider: 'github',
        callbackURL: buildBridgeCallback(),
      });
      if (socialError) {
        throw new Error(socialError.message ?? 'GitHub sign-in failed.');
      }
      const redirectUrl = data && typeof data === 'object' && 'url' in data ? data.url : null;
      if (typeof redirectUrl === 'string' && redirectUrl.length > 0) {
        window.location.assign(redirectUrl);
        return;
      }
      throw new Error('GitHub sign-in did not return a redirect URL.');
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
      const { data, error: magicError } = await authClient.signIn.magicLink({
        email: trimmed,
        callbackURL: buildBridgeCallback(),
      });
      if (magicError) {
        throw new Error(magicError.message ?? 'Could not send magic link.');
      }
      if (data && typeof data === 'object' && 'status' in data && data.status !== true) {
        throw new Error('Could not send magic link.');
      }
      setNotice('Check your email for a sign-in link. It expires in a few minutes.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setMagicSubmitting(false);
    }
  }

  async function handlePasswordSignIn(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setPasswordSubmitting(true);
    try {
      const callbackURL = buildBridgeCallback();
      const { data, error: signInError } = await authClient.signIn.email({
        email: trimmed,
        password,
        callbackURL,
      });
      if (signInError) {
        throw new Error(passwordSignInErrorMessage(signInError.message ?? 'Sign-in failed.'));
      }
      const redirectUrl = data && typeof data === 'object' && 'url' in data ? data.url : null;
      if (typeof redirectUrl === 'string' && redirectUrl.length > 0) {
        window.location.assign(redirectUrl);
        return;
      }
      window.location.assign(callbackURL);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPasswordSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setNotice('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email address first.');
      return;
    }
    setForgotSubmitting(true);
    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : '/reset-password';
      const { error: resetError } = await authClient.requestPasswordReset({
        email: trimmed,
        redirectTo,
      });
      if (resetError) {
        throw new Error(resetError.message ?? 'Could not send reset email.');
      }
      setNotice('If an account exists for that email, a password reset link has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setForgotSubmitting(false);
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

      {!compact && showEmailSection ? (
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

      {showEmailSection && providers.magicLink && providers.emailPassword ? (
        <div style={modeToggleStyle(isTerminal)}>
          <button
            type="button"
            style={modeButtonStyle(emailMode === 'magic', isTerminal)}
            disabled={socialBusy}
            onClick={() => setEmailMode('magic')}
          >
            Magic link
          </button>
          <button
            type="button"
            style={modeButtonStyle(emailMode === 'password', isTerminal)}
            disabled={socialBusy}
            onClick={() => setEmailMode('password')}
          >
            Password
          </button>
        </div>
      ) : null}

      {providers.magicLink && (!providers.emailPassword || emailMode === 'magic') ? (
        <form
          onSubmit={(e) => void handleMagicLink(e)}
          style={{ display: 'flex', flexDirection: 'column', gap: isTerminal ? 8 : 10 }}
        >
          {renderEmailInput({
            isTerminal,
            email,
            setEmail,
            emailInputClassName,
            socialBusy,
          })}
          <button type="submit" className={magicLinkClassName} disabled={socialBusy}>
            {magicSubmitting ? (isTerminal ? 'sending…' : 'Sending link…') : resolvedMagicLabel}
          </button>
        </form>
      ) : null}

      {providers.emailPassword && (!providers.magicLink || emailMode === 'password') ? (
        <form
          onSubmit={(e) => void handlePasswordSignIn(e)}
          style={{ display: 'flex', flexDirection: 'column', gap: isTerminal ? 8 : 10 }}
        >
          {renderEmailInput({
            isTerminal,
            email,
            setEmail,
            emailInputClassName,
            socialBusy,
          })}
          {renderPasswordInput({
            isTerminal,
            password,
            setPassword,
            emailInputClassName,
            socialBusy,
          })}
          <button type="submit" className={magicLinkClassName} disabled={socialBusy}>
            {passwordSubmitting
              ? isTerminal
                ? 'signing in…'
                : 'Signing in…'
              : 'Sign in with password'}
          </button>
          {providers.magicLink ? (
            <button
              type="button"
              style={forgotLinkStyle(isTerminal)}
              disabled={socialBusy}
              onClick={() => void handleForgotPassword()}
            >
              {forgotSubmitting ? 'Sending reset link…' : 'Forgot password?'}
            </button>
          ) : null}
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

function renderEmailInput({
  isTerminal,
  email,
  setEmail,
  emailInputClassName,
  socialBusy,
}: {
  isTerminal: boolean;
  email: string;
  setEmail: (value: string) => void;
  emailInputClassName: string;
  socialBusy: boolean;
}) {
  if (isTerminal) {
    return (
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
    );
  }
  return (
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
  );
}

function renderPasswordInput({
  isTerminal,
  password,
  setPassword,
  emailInputClassName,
  socialBusy,
}: {
  isTerminal: boolean;
  password: string;
  setPassword: (value: string) => void;
  emailInputClassName: string;
  socialBusy: boolean;
}) {
  if (isTerminal) {
    return (
      <label style={termEmailRowStyle}>
        <span style={termEmailPromptStyle}>#</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={emailInputClassName}
          disabled={socialBusy}
          required
        />
      </label>
    );
  }
  return (
    <input
      type="password"
      name="password"
      autoComplete="current-password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className={emailInputClassName}
      disabled={socialBusy}
      required
    />
  );
}

function modeToggleStyle(isTerminal: boolean): CSSProperties {
  return {
    display: 'flex',
    gap: 8,
    fontFamily: isTerminal ? 'var(--font-mono, monospace)' : undefined,
  };
}

function modeButtonStyle(active: boolean, isTerminal: boolean): CSSProperties {
  return {
    flex: 1,
    padding: isTerminal ? '6px 10px' : '8px 12px',
    borderRadius: 8,
    border: active ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(74, 222, 128, 0.12)' : 'rgba(255,255,255,0.04)',
    color: active ? '#4ade80' : 'rgba(161,161,170,0.9)',
    fontSize: isTerminal ? 12 : 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: isTerminal ? 'var(--font-mono, monospace)' : undefined,
  };
}

function forgotLinkStyle(isTerminal: boolean): CSSProperties {
  return {
    margin: 0,
    padding: 0,
    border: 'none',
    background: 'none',
    color: 'rgba(161,161,170,0.85)',
    fontSize: isTerminal ? 12 : 13,
    textAlign: 'left' as const,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: isTerminal ? 'var(--font-mono, monospace)' : undefined,
  };
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
