import { prisma } from './prisma';

export function deriveUsernameBase(name: string | null | undefined, email: string): string {
  const fromName = name
    ?.trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  if (fromName && fromName.length >= 2) return fromName;
  const local = email
    .split('@')[0]
    ?.replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  return local && local.length >= 2 ? local : 'user';
}

export async function allocateUniqueUsername(base: string): Promise<string> {
  let candidate = base;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base.slice(0, 28)}${suffix}`;
  }
  return candidate;
}
