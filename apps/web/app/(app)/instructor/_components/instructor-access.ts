import type { ShellUser } from '../../_components/session-context';

export function hasInstructorAccess(
  user: Pick<ShellUser, 'systemRole' | 'memberships'> | null
): boolean {
  if (!user) return false;
  if (user.systemRole === 'admin') return true;
  return (
    user.memberships?.some((membership) => {
      const role = membership.role.toLowerCase();
      return role === 'instructor' || role === 'ta';
    }) ?? false
  );
}
