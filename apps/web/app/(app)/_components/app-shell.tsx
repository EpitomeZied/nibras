'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiFetch } from '../../lib/session';
import { prefs, PREF_EVENTS } from '../../lib/prefs';
import { SessionProvider } from './session-context';
import TopHeader from './top-header';
import styles from './app-shell.module.css';

type ShellSessionPayload = {
  user: {
    id: string;
    username: string;
    email: string;
    displayName?: string | null;
    githubLogin: string;
    githubLinked: boolean;
    githubAppInstalled: boolean;
    systemRole?: string;
    yearLevel?: number;
  };
  memberships?: Array<{ courseId: string; role: string; level: number }>;
};

type ShellUser = ShellSessionPayload['user'] & {
  memberships?: ShellSessionPayload['memberships'];
};

function isPublicCommunityPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/community' || pathname.startsWith('/community/q/')) return true;
  if (pathname === '/community/discussions' || pathname.startsWith('/community/discussions/')) {
    return true;
  }
  return false;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<ShellUser | null>(null);
  const [loading, setLoading] = useState(true);
  const shellRef = useRef<HTMLDivElement>(null);
  const isWideDashboard = pathname === '/dashboard';

  // Apply compact mode from localStorage and listen for changes
  useEffect(() => {
    function applyCompact() {
      const compact = prefs.getCompact();
      shellRef.current?.setAttribute('data-compact', String(compact));
    }

    applyCompact();

    function onCompactChanged() {
      applyCompact();
    }

    window.addEventListener(PREF_EVENTS.compactChanged, onCompactChanged);
    return () => window.removeEventListener(PREF_EVENTS.compactChanged, onCompactChanged);
  }, []);

  async function applySessionResponse(response: Response): Promise<boolean> {
    if (!response.ok) return false;
    const payload = (await response.json()) as ShellSessionPayload;
    setSession({ ...payload.user, memberships: payload.memberships ?? [] });
    return true;
  }

  async function loadSession(): Promise<boolean> {
    const response = await apiFetch('/v1/web/session', { auth: true });
    if (!response.ok) {
      window.location.href = '/?auth=required';
      return false;
    }
    return applySessionResponse(response);
  }

  async function refreshSessionSoft(): Promise<void> {
    try {
      const response = await apiFetch('/v1/web/session', { auth: true });
      if (response.ok) {
        await applySessionResponse(response);
      }
    } catch {
      // Keep the last known session while revalidating in the background.
    }
  }

  // Initial session load — once on mount, not on every navigation.
  useEffect(() => {
    let alive = true;
    const publicCommunity = isPublicCommunityPath(pathname);

    void (async () => {
      if (publicCommunity) {
        try {
          const response = await apiFetch('/v1/web/session', { auth: true });
          if (response.ok) {
            const payload = (await response.json()) as ShellSessionPayload;
            if (alive) {
              setSession({ ...payload.user, memberships: payload.memberships ?? [] });
            }
          } else if (alive) {
            setSession(null);
          }
        } catch {
          if (alive) setSession(null);
        } finally {
          if (alive) setLoading(false);
        }
        return;
      }

      try {
        await loadSession();
      } catch {
        if (alive) {
          window.location.href = '/?auth=required';
        }
        return;
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the user opens a protected route without a session (e.g. from public community), auth once.
  useEffect(() => {
    if (isPublicCommunityPath(pathname) || session || loading) return;
    void loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, session, loading]);

  // Stale-while-revalidate when the tab becomes visible again.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refreshSessionSoft();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionProvider
      user={session}
      loading={loading}
      refreshSession={async () => {
        await loadSession();
      }}
    >
      <div ref={shellRef} className={styles.appShell}>
        <div className={styles.mainArea}>
          <TopHeader user={session} loading={loading} />
          <div className={styles.pageBody}>
            <div className={styles.pageInner} data-wide={isWideDashboard ? 'true' : undefined}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
