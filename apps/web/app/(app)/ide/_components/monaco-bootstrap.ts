'use client';

import { loader } from '@monaco-editor/react';

if (typeof window !== 'undefined') {
  loader.config({ paths: { vs: '/monaco/vs' } });
}

let initPromise: Promise<void> | null = null;

export function ensureMonacoReady(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (!initPromise) {
    initPromise = loader.init().then(() => undefined);
  }

  return initPromise;
}
