/**
 * Normalise API responses that may be a bare array or a keyed wrapper.
 */
export function unwrapList<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object' && key in payload) {
    const value = (payload as Record<string, unknown>)[key];
    return Array.isArray(value) ? (value as T[]) : [];
  }
  return [];
}

export function emitJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
