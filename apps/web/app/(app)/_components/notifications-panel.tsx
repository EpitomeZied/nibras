'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/session';
import DropdownMenu, { useDropdownClose } from './ui/dropdown-menu';

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
};

const TYPE_COLOR: Record<string, string> = {
  feedback: 'var(--purple)',
  passed: 'var(--success)',
  failed: 'var(--danger)',
  review: 'var(--warning)',
  community_answer: 'var(--primary)',
  community_answer_accepted: 'var(--success)',
  community_vote: 'var(--warning)',
  community_reply: 'var(--primary)',
  community_moderation: 'var(--primary)',
};

function colorForType(type: string): string {
  return TYPE_COLOR[type] ?? 'var(--primary)';
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1.5a5.5 5.5 0 00-5.5 5.5v3L2 12h14l-1.5-2V7A5.5 5.5 0 009 1.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M7 12v.5a2 2 0 004 0V12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NotificationItem({ n }: { n: NotificationRecord }) {
  const close = useDropdownClose();
  const color = colorForType(n.type);
  const inner = (
    <div
      style={{
        padding: '11px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        background: n.read ? 'transparent' : 'rgba(167,139,250,0.04)',
        transition: 'background 0.12s',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          marginTop: 6,
          flexShrink: 0,
          opacity: n.read ? 0.35 : 1,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 3,
            opacity: n.read ? 0.55 : 1,
          }}
        >
          {n.title}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {n.body}
        </div>
      </div>
    </div>
  );

  if (n.link) {
    const isInternal = n.link.startsWith('/');
    return (
      <a
        href={n.link}
        style={{ textDecoration: 'none', display: 'block' }}
        onClick={close}
        {...(isInternal ? {} : { target: '_blank', rel: 'noreferrer' })}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function NotificationsPanelContent({
  loaded,
  notifications,
}: {
  loaded: boolean;
  notifications: NotificationRecord[];
}) {
  const unreadInList = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div
        style={{
          padding: '13px 16px 11px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <strong style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>Notifications</strong>
        {unreadInList > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: 'var(--danger)',
              color: '#fff',
              borderRadius: 999,
              padding: '2px 7px',
            }}
          >
            {unreadInList} new
          </span>
        )}
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {!loaded ? (
          <div
            style={{
              padding: '24px 16px',
              color: 'rgba(161,161,170,0.5)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              color: 'rgba(161,161,170,0.5)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            All caught up
          </div>
        ) : (
          notifications.map((n) => <NotificationItem key={n.id} n={n} />)
        )}
      </div>
    </>
  );
}

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await apiFetch('/v1/notifications/count', { auth: true });
      if (res.ok) {
        const data = (await res.json()) as { count: number };
        setUnreadCount(data.count);
      }
    } catch {
      // silently ignore — badge stays at last known value
    }
  }, []);

  useEffect(() => {
    void fetchCount();
    const id = setInterval(() => void fetchCount(), 60_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  useEffect(() => {
    if (!open) return;

    void (async () => {
      try {
        const res = await apiFetch('/v1/notifications', { auth: true });
        if (res.ok) {
          const data = (await res.json()) as { notifications: NotificationRecord[] };
          setNotifications(data.notifications);
        }
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }

      try {
        await apiFetch('/v1/notifications/read-all', { method: 'POST', auth: true });
        setUnreadCount(0);
      } catch {
        // ignore
      }
    })();
  }, [open]);

  function handleOpenChange(next: boolean) {
    if (next) setLoaded(false);
    setOpen(next);
  }

  return (
    <DropdownMenu
      align="end"
      width="lg"
      onOpenChange={handleOpenChange}
      trigger={({ open, triggerRef, triggerProps }) => (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Notifications"
          title="Notifications"
          {...triggerProps}
          style={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid transparent',
            background: open ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: open ? 'rgba(250,250,250,0.9)' : 'rgba(161,161,170,0.7)',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(250,250,250,0.85)';
            }
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(161,161,170,0.7)';
            }
          }}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--danger)',
                border: '1.5px solid rgba(10,10,10,0.9)',
                display: 'block',
              }}
            />
          )}
        </button>
      )}
    >
      <NotificationsPanelContent loaded={loaded} notifications={notifications} />
    </DropdownMenu>
  );
}
