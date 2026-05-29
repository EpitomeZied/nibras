'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import DropdownMenu, { DropdownChevron, DropdownGroup, useDropdownClose } from './ui/dropdown-menu';
import { usePathname } from 'next/navigation';
import UserAvatar from './widgets/UserAvatar';
import NibrasLogo from '@/app/_components/nibras-logo';
import { WEB_BASE_URL } from '@/app/lib/web-base-url';
import { prefs, PREF_EVENTS } from '../../lib/prefs';
import NotificationsPanel from './notifications-panel';
import {
  getActiveNavItemInGroup,
  getAdminNavItem,
  getNavItemsForGroup,
  getPrimaryNavItems,
  isNavGroupActive,
  isNavItemActive,
  navDropdownGroups,
  type AppNavItem,
  type NavDropdownGroup,
} from './nav-config';
import { getShellUserIdentity } from './session-context';

type ShellSessionUser = {
  username: string;
  email: string;
  displayName?: string | null;
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
  identity,
}: {
  user: ShellSessionUser | null;
  loading: boolean;
  identity: string;
}) {
  const isAdmin = user?.systemRole === 'admin';
  const menuItems = [
    ...(isAdmin ? [{ label: 'Builder', icon: <IconBuilder />, href: '/instructor' }] : []),
    { label: 'Profile', icon: <IconProfile />, href: '/users' },
    { label: 'Settings', icon: <IconSettings />, href: '/settings' },
    {
      label: 'Send Feedback',
      icon: <IconFeedback />,
      href: 'mailto:support@nibrasplatform.me?subject=Nibras%20Feedback',
    },
  ];

  return (
    <DropdownMenu
      align="end"
      width="sm"
      menuKeyboard
      trigger={({ open, triggerRef, triggerProps }) => (
        <button
          ref={triggerRef}
          type="button"
          aria-label="User menu"
          {...triggerProps}
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
          <UserAvatar
            name={identity}
            size={26}
            githubLogin={user?.githubLogin}
            loading={loading}
            alt={user?.githubLogin ?? 'avatar'}
            useNextImage
            style={{
              border: '1px solid rgba(255,255,255,0.14)',
              flexShrink: 0,
            }}
          />
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
          <DropdownChevron open={open} />
        </button>
      )}
    >
      <UserMenuPanel
        menuItems={menuItems}
        identity={identity}
        email={user?.email}
        loading={loading}
      />
    </DropdownMenu>
  );
}

function UserMenuPanel({
  menuItems,
  identity,
  email,
  loading,
}: {
  menuItems: Array<{ label: string; icon: ReactNode; href: string }>;
  identity: string;
  email?: string;
  loading: boolean;
}) {
  const close = useDropdownClose();

  return (
    <>
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
          {email || '—'}
        </div>
      </div>

      <div style={{ padding: '6px 0' }}>
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            role="menuitem"
            onClick={close}
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

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '6px 0' }}>
        <Link
          href="/"
          role="menuitem"
          onClick={close}
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
    </>
  );
}

/* ── Nav link + grouped dropdown ─────────────────────────────────────────── */

function navLinkStyle(isActive: boolean, compact: boolean): CSSProperties {
  return {
    padding: compact ? '4px 9px' : '5px 11px',
    borderRadius: 7,
    fontSize: compact ? 12 : 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#fafafa' : 'rgba(161,161,170,0.7)',
    textDecoration: 'none',
    background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  };
}

function NavLink({
  item,
  compact,
  pathname,
}: {
  item: AppNavItem;
  compact: boolean;
  pathname: string | null;
}) {
  const isActive = isNavItemActive(item, pathname);
  return (
    <Link href={item.href} title={item.description} style={navLinkStyle(isActive, compact)}>
      {item.label}
    </Link>
  );
}

function NavDropdown({
  group,
  items,
  compact,
  pathname,
}: {
  group: NavDropdownGroup;
  items: AppNavItem[];
  compact: boolean;
  pathname: string | null;
}) {
  const isActive = isNavGroupActive(group.id, items, pathname);
  const activeItem = getActiveNavItemInGroup(items, pathname);

  if (items.length === 0) return null;

  return (
    <DropdownMenu
      align="start"
      width="auto"
      menuKeyboard
      trigger={({ open, triggerRef, triggerProps }) => (
        <button
          ref={triggerRef}
          type="button"
          title={group.description}
          {...triggerProps}
          style={{
            ...navLinkStyle(isActive, compact),
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          {isActive && activeItem ? activeItem.label : group.label}
          <DropdownChevron open={open} />
        </button>
      )}
    >
      <NavMenuPanel group={group} items={items} pathname={pathname} />
    </DropdownMenu>
  );
}

function NavMenuPanel({
  group,
  items,
  pathname,
}: {
  group: NavDropdownGroup;
  items: AppNavItem[];
  pathname: string | null;
}) {
  const close = useDropdownClose();

  return (
    <>
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(161,161,170,0.55)',
            marginBottom: 4,
          }}
        >
          {group.label}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(161,161,170,0.65)', lineHeight: 1.4 }}>
          {group.description}
        </div>
      </div>

      <div style={{ padding: '6px 0' }}>
        {items.map((item) => {
          const itemActive = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              title={item.description}
              onClick={close}
              style={{
                display: 'block',
                padding: '9px 14px',
                textDecoration: 'none',
                transition: 'background 0.12s',
                background: itemActive ? 'rgba(255,255,255,0.05)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = itemActive
                  ? 'rgba(255,255,255,0.05)'
                  : 'transparent';
              }}
            >
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: itemActive ? 600 : 500,
                  color: itemActive ? '#fafafa' : 'rgba(250,250,250,0.85)',
                  marginBottom: 2,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(161,161,170,0.6)', lineHeight: 1.35 }}>
                {item.description}
              </div>
            </Link>
          );
        })}
      </div>
    </>
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
  const identity = getShellUserIdentity(user);
  const [compact, setCompact] = useState(false);

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
      <DropdownGroup>
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
                href={WEB_BASE_URL}
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
              {getPrimaryNavItems(user).map((item) => (
                <NavLink key={item.href} item={item} compact={compact} pathname={pathname} />
              ))}
              {navDropdownGroups.map((group) => (
                <NavDropdown
                  key={group.id}
                  group={group}
                  items={getNavItemsForGroup(group.id, user)}
                  compact={compact}
                  pathname={pathname}
                />
              ))}
              {(() => {
                const adminItem = getAdminNavItem(user);
                return adminItem ? (
                  <NavLink item={adminItem} compact={compact} pathname={pathname} />
                ) : null;
              })()}
            </nav>
          </div>

          {/* Right: Notifications + User dropdown */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: compact ? 2 : 4, flexShrink: 0 }}
          >
            <NotificationsPanel />
            <UserDropdown user={user} loading={loading} identity={identity} />
          </div>
        </div>
      </DropdownGroup>
    </header>
  );
}
