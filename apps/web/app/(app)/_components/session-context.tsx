'use client';
import React, { createContext, useContext } from 'react';

export interface ShellUser {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  githubLogin: string | null;
  githubLinked: boolean;
  githubAppInstalled: boolean;
  systemRole?: string | null;
  yearLevel?: number;
  memberships?: Array<{ courseId: string; role: string; level: number }>;
}

interface SessionContextValue {
  user: ShellUser | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refreshSession: async () => {},
});

export function SessionProvider({
  children,
  user,
  loading,
  refreshSession,
}: {
  children: React.ReactNode;
  user: ShellUser | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}) {
  return (
    <SessionContext.Provider value={{ user, loading, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

export function getShellUserIdentity(
  user: Pick<ShellUser, 'displayName' | 'username' | 'githubLogin'> | null,
  fallback = 'Nibras'
): string {
  return user?.displayName?.trim() || user?.username || user?.githubLogin || fallback;
}
