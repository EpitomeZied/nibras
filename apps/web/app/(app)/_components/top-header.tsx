'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getInitials } from '../../lib/utils';
import NibrasLogo from '@/app/_components/nibras-logo';
import { prefs, PREF_EVENTS } from '../../lib/prefs';
import NotificationsPanel from './notifications-panel';
import { appNavItems, canAccessNavItem, isNavItemActive } from './nav-config';

type ShellSessionUser = {
  username: string;
  email: string;
  githubLogin: string;
  githubLinked: boolean;
  githubAppInstalled: boolean;
  systemRole?: string;
  memberships?: Array<{ courseId: string; role: string; level: number }>;
};

/* ── Dropdown icons ──────────────────────────────────────────────────────── */

function IconBuilder() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconFeedback() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ── Dropdown component ──────────────────────────────────────────────────── */

function UserDropdown({
  user,
  loading,
  githubAvatarUrl,
  identity,
}: {
  user: ShellSessionUser | null;
  loading: boolean;
  githubAvatarUrl: string | null;
  identity: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const isAdmin = user?.systemRole === 'admin';
  const menuItems = [
    ...(isAdmin ? [{ label: 'Builder', icon: <IconBuilder />, href: '/instructor' }] : []),
    { label: 'Profile', icon: <IconProfile />, href: '/settings' },
    { label: 'Settings', icon: <IconSettings />, href: '/settings' },
    {
      label: 'Send Feedback',
      icon: <IconFeedback />,
      href: 'mailto:epitomezied@gmail.com?subject=Feedback',
    },
  ];

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      {/* ── Trigger button ── */}
      <button
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: open ? 'rgba(255,255,255,0.07)' : 'transparent',
          border: open ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
          borderRadius: 9,
          padding: '3px 8px 3px 4px',
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'transparent';
        }}
      >
        {githubAvatarUrl ? (
          <Image
            src={githubAvatarUrl}
            alt={user?.githubLogin ?? 'avatar'}
            width={26}
            height={26}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          />
        ) : (
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.14)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#fafafa',
              flexShrink: 0,
            }}
          >
            {loading ? '…' : getInitials(identity)}
          </span>
        )}
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(250,250,250,0.8)',
            maxWidth: 110,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '…' : identity}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          style={{
            color: 'rgba(161,161,170,0.5)',
            flexShrink: 0,
            transition: 'transform 0.18s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 220,
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            zIndex: 200,
            animation: 'dropIn 0.14s ease',
          }}
        >
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)    scale(1); }
            }
          `}</style>

          {/* User info header */}
          <div
            style={{
              padding: '14px 16px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#fafafa',
                lineHeight: 1.3,
                marginBottom: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? '…' : identity}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(161,161,170,0.55)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email || '—'}
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: '6px 0' }}>
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '9px 16px',
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: 'rgba(161,161,170,0.8)',
                  textDecoration: 'none',
                  transition: 'background 0.12s, color 0.12s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(161,161,170,0.8)';
                }}
              >
                <span
                  style={{
                    color: 'rgba(161,161,170,0.5)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Divider + Sign out */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '6px 0' }}>
            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 16px',
                fontSize: 13.5,
                fontWeight: 500,
                color: 'rgba(248,113,113,0.75)',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.07)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(248,113,113,0.75)';
              }}
            >
              <span
                style={{
                  color: 'rgba(248,113,113,0.55)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <IconSignOut />
              </span>
              Sign out
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Top Header ──────────────────────────────────────────────────────────── */

export default function TopHeader({
  user,
  loading,
}: {
  user: ShellSessionUser | null;
  loading: boolean;
}) {
  const pathname = usePathname();
  const identity = user?.username || user?.githubLogin || 'Nibras';
  const [compact, setCompact] = useState(false);

  const githubAvatarUrl =
    user?.githubLogin && user.githubLinked
      ? `https://avatars.githubusercontent.com/${user.githubLogin}?s=64`
      : null;

  useEffect(() => {
    function syncCompact() {
      setCompact(prefs.getCompact());
    }

    syncCompact();
    window.addEventListener(PREF_EVENTS.compactChanged, syncCompact);
    return () => window.removeEventListener(PREF_EVENTS.compactChanged, syncCompact);
  }, []);

  return (
    <header
      className="topHeader"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(10,10,10,0.88)',
      }}
    >
      {/* ── Centered inner wrapper ── */}
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: compact ? '0 24px' : '0 40px',
          height: compact ? 46 : 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: compact ? 16 : 24,
        }}
      >
        {/* Left: Logo + Beta + Nav */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: compact ? 14 : 20, flexShrink: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8 }}>
            <a
              href="https://nibrasplatform.me"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit NibrasPlaftorm.me"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <NibrasLogo variant="inverse" width={compact ? 82 : 90} priority />
            </a>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(74,222,128,0.9)',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.22)',
                borderRadius: 999,
                padding: '2px 8px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Beta
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: compact ? 0 : 2 }}>
            {appNavItems
              .filter((item) => canAccessNavItem(item, user))
              .map((item) => {
                const isActive = isNavItemActive(item, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.description}
                    style={{
                      padding: compact ? '4px 9px' : '5px 11px',
                      borderRadius: 7,
                      fontSize: compact ? 12 : 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#fafafa' : 'rgba(161,161,170,0.7)',
                      textDecoration: 'none',
                      background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                      transition: 'background 0.15s, color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            <Link
              href="/settings"
              style={{
                padding: compact ? '4px 9px' : '5px 11px',
                borderRadius: 7,
                fontSize: compact ? 12 : 13,
                fontWeight: pathname === '/settings' ? 600 : 500,
                color: pathname === '/settings' ? '#fafafa' : 'rgba(161,161,170,0.7)',
                textDecoration: 'none',
                background: pathname === '/settings' ? 'rgba(255,255,255,0.07)' : 'transparent',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              Settings
            </Link>
          </nav>
        </div>

        {/* Right: GitHub Star + Notifications + User dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 2 : 4, flexShrink: 0 }}>
          {/* GitHub Star button */}
          <a
            href="https://github.com/NibrasPlatform"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star NibrasPlaftorm on GitHub"
            title="Star on GitHub"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(250,250,250,0.75)',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
              e.currentTarget.style.color = '#fafafa';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(250,250,250,0.75)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" />
            </svg>
            {!compact && 'Star'}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.5 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none"/>
            </svg>
          </a>
          <NotificationsPanel />
          <UserDropdown
            user={user}
            loading={loading}
            githubAvatarUrl={githubAvatarUrl}
            identity={identity}
          />
        </div>
      </div>
    </header>
  );
}
