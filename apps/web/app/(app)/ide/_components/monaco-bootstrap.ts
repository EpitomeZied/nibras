'use client';

import { loader } from '@monaco-editor/react';

if (typeof window !== 'undefined') {
  loader.config({ paths: { vs: '/monaco/vs' } });
}

let initPromise: Promise<void> | null = null;

async function verifyMonacoAssets(): Promise<void> {
  const response = await fetch('/monaco/vs/loader.js', { method: 'HEAD' });
  if (!response.ok) {
    throw new Error(`Monaco editor assets are unavailable (HTTP ${response.status}).`);
  }
}

export function ensureMonacoReady(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (!initPromise) {
    initPromise = verifyMonacoAssets()
      .then(() => loader.init())
      .then(() => undefined);
  }

  return initPromise;
}
