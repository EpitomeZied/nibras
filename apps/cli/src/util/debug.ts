function isDebugEnabled(): boolean {
  const value = process.env.DEBUG;
  if (!value) return false;
  return value === 'nibras' || value === 'nibras:*' || value.includes('nibras:');
}

export function debugLog(scope: string, message: string, details?: Record<string, unknown>): void {
  if (!isDebugEnabled()) return;
  const suffix = details ? ` ${JSON.stringify(details)}` : '';
  console.error(`[nibras:${scope}] ${message}${suffix}`);
}
