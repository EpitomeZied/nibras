/** Derive contest length from timestamps so UI never shows a stale default. */
export function effectiveDurationMinutes(
  startsAt: Date,
  endsAt: Date,
  storedMinutes: number
): number {
  const computed = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  if (computed > 0) return computed;
  return storedMinutes > 0 ? storedMinutes : 1;
}
