const buckets = new Map<string, number>();

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function rateLimited<T>(
  platform: string,
  delayMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const lastCall = buckets.get(platform) ?? 0;
  const elapsed = now - lastCall;
  if (elapsed < delayMs) {
    await delay(delayMs - elapsed);
  }
  buckets.set(platform, Date.now());
  return fn();
}
