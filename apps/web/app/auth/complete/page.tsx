'use client';

import { useEffect, useState } from 'react';
import { sanitizeNextPath } from '@/lib/public-origin';
import styles from './page.module.css';

type LogLine = { text: string; type: 'cmd' | 'info' | 'success' | 'error' | 'muted' };

const VERIFY_TIMEOUT_MS = 12_000;

async function verifySession(sessionToken: string | null): Promise<void> {
  const verifyUrl = sessionToken
    ? `/api/nibras/verify-session?st=${encodeURIComponent(sessionToken)}`
    : '/api/nibras/verify-session';

  const response = await fetch(verifyUrl, {
    credentials: 'include',
    signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
  });

  if (!response.ok) {
    let message = 'Web session was not established.';
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      /* use default */
    }
    throw new Error(message);
  }
}

export default function AuthCompletePage() {
  const [lines, setLines] = useState<LogLine[]>([
    { text: 'nibras login', type: 'cmd' },
    { text: 'Verifying session…', type: 'info' },
  ]);
  const [done, setDone] = useState(false);

  function addLine(line: LogLine) {
    setLines((prev) => [...prev, line]);
  }

  useEffect(() => {
    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const st = params.get('st');
        const next = sanitizeNextPath(params.get('next'), '/dashboard');

        await verifySession(st);

        if (st) {
          window.localStorage.setItem('nibras.webSession', st);
        }

        addLine({ text: '✓ Session established', type: 'success' });
        addLine({ text: 'Redirecting…', type: 'muted' });
        setDone(true);

        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);

        window.setTimeout(() => {
          window.location.href = next;
        }, 900);
      } catch (err) {
        setDone(true);
        const message =
          err instanceof Error && err.name === 'TimeoutError'
            ? 'Session verification timed out — try signing in again.'
            : err instanceof Error
              ? err.message
              : String(err);
        addLine({ text: `✗ ${message}`, type: 'error' });
      }
    })();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <span className={styles.dot} style={{ background: '#ff5f57' }} />
          <span className={styles.dot} style={{ background: '#febc2e' }} />
          <span className={styles.dot} style={{ background: '#28c840' }} />
          <span className={styles.title}>nibras — terminal</span>
        </div>
        <div className={styles.body}>
          {lines.map((line, i) => (
            <div key={i} className={`${styles.line} ${styles[line.type]}`}>
              {line.type === 'cmd' && <span className={styles.prompt}>~ </span>}
              {line.text}
            </div>
          ))}
          {!done && <span className={styles.cursor} />}
        </div>
      </div>
    </main>
  );
}
