'use client';

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

let configured = false;

export function configureMonacoLoader(): void {
  if (configured || typeof window === 'undefined') return;

  self.MonacoEnvironment = {
    getWorker(_workerId, _label) {
      return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url));
    },
  };

  loader.config({ monaco });
  configured = true;
}
