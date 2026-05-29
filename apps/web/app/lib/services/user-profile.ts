import type { UserProfileResponse } from '@nibras/contracts';
import { apiFetch } from '../session';

export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  const response = await apiFetch(`/v1/users/${encodeURIComponent(userId)}`, { auth: true });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    const err = new Error(payload.error || `Failed to load profile (${response.status})`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }
  return (await response.json()) as UserProfileResponse;
}

export type { UserProfileResponse };
