'use client';

import { authClient } from '@/lib/auth-client';
import { apiFetch } from './session';

const LEGACY_SESSION_KEYS = [
  'nibras.webSession',
  'token',
  'refreshToken',
  'user',
  'nibras.dashboardUser',
] as const;

function clearLocalSession() {
  for (const key of LEGACY_SESSION_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/** Revoke API web session, clear Better Auth, and redirect home. */
export async function signOutWebSession(): Promise<void> {
  try {
    await apiFetch('/v1/web/logout', { method: 'POST', auth: true });
  } catch {
    /* proceed with local cleanup */
  }

  clearLocalSession();

  try {
    await authClient.signOut();
  } catch {
    /* ignore */
  }

  window.location.href = '/';
}
