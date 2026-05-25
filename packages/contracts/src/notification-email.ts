const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GITHUB_NOREPLY_RE = /@users\.noreply\.github\.com$/i;

/** Normalize and validate an address the user typed for notifications. */
export function normalizeNotificationEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254 || !EMAIL_RE.test(trimmed)) return null;
  return trimmed;
}

export type UserEmailFields = {
  email: string;
  notificationEmail?: string | null;
};

/** Address to use for outbound mail; prefers notificationEmail, skips GitHub noreply fallbacks. */
export function resolveOutboundEmail(user: UserEmailFields): string | null {
  const custom = user.notificationEmail?.trim();
  if (custom) {
    const normalized = normalizeNotificationEmail(custom);
    if (normalized) return normalized;
  }
  const account = user.email?.trim();
  if (!account || !EMAIL_RE.test(account) || GITHUB_NOREPLY_RE.test(account)) return null;
  return account.toLowerCase();
}
